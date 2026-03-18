import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import dicomParser from 'dicom-parser';

import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { Volume } from '../models/Volume.js';

const VOLUMES_DIR = path.join(config.uploadDir, 'volumes');
if (!existsSync(VOLUMES_DIR)) mkdirSync(VOLUMES_DIR, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes, files: 2000 },
});

function extractDicomTag(dataSet, tag, fallback = '') {
  try {
    return dataSet.string(tag) ?? fallback;
  } catch {
    return fallback;
  }
}

function extractDicomNumber(dataSet, tag) {
  try {
    const val = dataSet.string(tag);
    return val != null ? parseFloat(val) : null;
  } catch {
    return null;
  }
}

function parseDicomMetadata(buffer) {
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    return {
      seriesInstanceUID: extractDicomTag(dataSet, 'x0020000e'),
      studyInstanceUID: extractDicomTag(dataSet, 'x0020000d'),
      patientName: extractDicomTag(dataSet, 'x00100010', 'Unknown'),
      patientId: extractDicomTag(dataSet, 'x00100020', 'Unknown'),
      modality: extractDicomTag(dataSet, 'x00080060', 'Unknown'),
      bodyPart: extractDicomTag(dataSet, 'x00180015', 'Unknown'),
      studyDate: extractDicomTag(dataSet, 'x00080020'),
      seriesDescription: extractDicomTag(dataSet, 'x0008103e'),
      institutionName: extractDicomTag(dataSet, 'x00080080'),
      rows: dataSet.uint16('x00280010') ?? null,
      columns: dataSet.uint16('x00280011') ?? null,
      sliceThickness: extractDicomNumber(dataSet, 'x00180050'),
      instanceNumber: extractDicomNumber(dataSet, 'x00200013') ?? 0,
      sliceLocation: extractDicomNumber(dataSet, 'x00201041'),
    };
  } catch (err) {
    logger.warn(`DICOM metadata parse failed: ${err.message}`);
    return null;
  }
}

const router = Router();

router.post('/upload', upload.array('files', 2000), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: { message: 'No files uploaded. Use field name "files".', status: 400 },
      });
    }

    const volumeId = uuidv4();
    const volumeDir = path.join(VOLUMES_DIR, volumeId);
    mkdirSync(volumeDir, { recursive: true });

    const filesWithMeta = [];

    for (const file of req.files) {
      const meta = parseDicomMetadata(file.buffer);
      const instanceNum = meta?.instanceNumber ?? filesWithMeta.length;
      const fileName = `${String(instanceNum).padStart(6, '0')}.dcm`;
      const filePath = path.join(volumeDir, fileName);
      await fs.writeFile(filePath, file.buffer);
      filesWithMeta.push({ fileName, meta, instanceNumber: instanceNum });
    }

    filesWithMeta.sort((a, b) => a.instanceNumber - b.instanceNumber);

    const firstMeta = filesWithMeta[0]?.meta || {};
    const fileNames = filesWithMeta.map((f) => f.fileName);

    let volume = null;
    try {
      volume = await Volume.create({
        seriesInstanceUID: firstMeta.seriesInstanceUID || volumeId,
        studyInstanceUID: firstMeta.studyInstanceUID,
        patientName: firstMeta.patientName,
        patientId: firstMeta.patientId,
        modality: firstMeta.modality,
        bodyPart: firstMeta.bodyPart,
        studyDate: firstMeta.studyDate,
        seriesDescription: firstMeta.seriesDescription,
        institutionName: firstMeta.institutionName,
        sliceCount: fileNames.length,
        sliceThickness: firstMeta.sliceThickness,
        dimensions: { rows: firstMeta.rows, columns: firstMeta.columns },
        storagePath: volumeDir,
        fileNames,
        status: 'ready',
      });
    } catch (dbErr) {
      logger.warn(`MongoDB save skipped: ${dbErr.message}`);
    }

    res.status(201).json({
      volumeId: volume?._id?.toString() ?? volumeId,
      seriesInstanceUID: firstMeta.seriesInstanceUID,
      modality: firstMeta.modality,
      patientName: firstMeta.patientName,
      bodyPart: firstMeta.bodyPart,
      sliceCount: fileNames.length,
      dimensions: { rows: firstMeta.rows, columns: firstMeta.columns },
      storagePath: volumeId,
      fileNames,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req, res) => {
  try {
    const volumes = await Volume.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(volumes);
  } catch {
    res.json([]);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const volume = await Volume.findById(req.params.id).lean();
    if (!volume) {
      return res.status(404).json({ error: { message: 'Volume not found', status: 404 } });
    }
    res.json(volume);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/files/:fileIndex', async (req, res, next) => {
  try {
    const { id, fileIndex } = req.params;

    let volume;
    try {
      volume = await Volume.findById(id).lean();
    } catch {
      volume = null;
    }

    if (!volume) {
      const dirPath = path.join(VOLUMES_DIR, id);
      try {
        const files = await fs.readdir(dirPath);
        files.sort();
        const idx = parseInt(fileIndex, 10);
        if (idx < 0 || idx >= files.length) {
          return res.status(404).json({ error: { message: 'File not found', status: 404 } });
        }
        const filePath = path.join(dirPath, files[idx]);
        res.set('Content-Type', 'application/dicom');
        res.set('Access-Control-Allow-Origin', '*');
        const data = await fs.readFile(filePath);
        return res.send(data);
      } catch {
        return res.status(404).json({ error: { message: 'Volume not found', status: 404 } });
      }
    }

    const idx = parseInt(fileIndex, 10);
    if (idx < 0 || idx >= volume.fileNames.length) {
      return res.status(404).json({ error: { message: 'File index out of range', status: 404 } });
    }

    const filePath = path.join(volume.storagePath, volume.fileNames[idx]);
    res.set('Content-Type', 'application/dicom');
    res.set('Access-Control-Allow-Origin', '*');
    const data = await fs.readFile(filePath);
    res.send(data);
  } catch (err) {
    next(err);
  }
});

export default router;
