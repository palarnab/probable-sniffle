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

const VR_DIR = path.join(config.uploadDir, 'volume-renderer');
if (!existsSync(VR_DIR)) mkdirSync(VR_DIR, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.maxVolumeFileSizeBytes, files: 2000 },
});

function extractTag(dataSet, tag, fallback = '') {
  try {
    return dataSet.string(tag) ?? fallback;
  } catch {
    return fallback;
  }
}

function extractNumber(dataSet, tag) {
  try {
    const val = dataSet.string(tag);
    return val != null ? parseFloat(val) : null;
  } catch {
    return null;
  }
}

function parseDicom(buffer) {
  try {
    const byteArray = new Uint8Array(buffer);
    const ds = dicomParser.parseDicom(byteArray);
    return {
      seriesInstanceUID: extractTag(ds, 'x0020000e'),
      studyInstanceUID: extractTag(ds, 'x0020000d'),
      patientName: extractTag(ds, 'x00100010', 'Unknown'),
      patientId: extractTag(ds, 'x00100020', 'Unknown'),
      modality: extractTag(ds, 'x00080060', 'Unknown'),
      bodyPart: extractTag(ds, 'x00180015', 'Unknown'),
      studyDate: extractTag(ds, 'x00080020'),
      seriesDescription: extractTag(ds, 'x0008103e'),
      institutionName: extractTag(ds, 'x00080080'),
      rows: ds.uint16('x00280010') ?? null,
      columns: ds.uint16('x00280011') ?? null,
      sliceThickness: extractNumber(ds, 'x00180050'),
      instanceNumber: extractNumber(ds, 'x00200013') ?? 0,
      sliceLocation: extractNumber(ds, 'x00201041'),
    };
  } catch (err) {
    logger.warn(`[volume-renderer] DICOM parse failed: ${err.message}`);
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
    const volumeDir = path.join(VR_DIR, volumeId);
    mkdirSync(volumeDir, { recursive: true });

    const entries = [];
    for (const file of req.files) {
      const meta = parseDicom(file.buffer);
      const instanceNum = meta?.instanceNumber ?? entries.length;
      const fileName = `${String(instanceNum).padStart(6, '0')}.dcm`;
      await fs.writeFile(path.join(volumeDir, fileName), file.buffer);
      entries.push({ fileName, meta, instanceNumber: instanceNum });
    }

    entries.sort((a, b) => a.instanceNumber - b.instanceNumber);
    const firstMeta = entries[0]?.meta || {};
    const fileNames = entries.map((e) => e.fileName);

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
      logger.warn(`[volume-renderer] MongoDB save skipped: ${dbErr.message}`);
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
    const list = await Volume.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(list);
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
      const dirPath = path.join(VR_DIR, id);
      try {
        const files = await fs.readdir(dirPath);
        files.sort();
        const idx = parseInt(fileIndex, 10);
        if (idx < 0 || idx >= files.length) {
          return res.status(404).json({ error: { message: 'File not found', status: 404 } });
        }
        res.set('Content-Type', 'application/dicom');
        res.set('Access-Control-Allow-Origin', '*');
        return res.send(await fs.readFile(path.join(dirPath, files[idx])));
      } catch {
        return res.status(404).json({ error: { message: 'Volume not found', status: 404 } });
      }
    }

    const idx = parseInt(fileIndex, 10);
    if (idx < 0 || idx >= volume.fileNames.length) {
      return res.status(404).json({ error: { message: 'File index out of range', status: 404 } });
    }

    res.set('Content-Type', 'application/dicom');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(await fs.readFile(path.join(volume.storagePath, volume.fileNames[idx])));
  } catch (err) {
    next(err);
  }
});

export default router;
