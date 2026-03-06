import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { parseDicom } from '../services/dicomService.js';
import { analyzeImage } from '../services/aiService.js';
import { Study } from '../models/Study.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeBytes },
});

function computeTriage(findings) {
  const maxProb = Math.max(...findings.map((f) => f.probability));

  if (maxProb > 0.8) return { priorityLevel: 'Critical', recommendedAction: 'Immediate radiologist review required' };
  if (maxProb > 0.5) return { priorityLevel: 'Urgent', recommendedAction: 'Expedited radiologist review recommended' };
  if (maxProb > 0.3) return { priorityLevel: 'Routine', recommendedAction: 'Standard radiologist review' };
  return { priorityLevel: 'Low', recommendedAction: 'Normal findings — routine follow-up' };
}

const router = Router();

router.post('/', upload.single('file'), async (req, res, next) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded. Use field name "file".', status: 400 } });
    }

    const studyId = uuidv4();
    const buffer = req.file.buffer;

    let metadata;
    try {
      metadata = parseDicom(buffer);
    } catch (err) {
      logger.warn(`DICOM parse failed, using defaults: ${err.message}`);
      metadata = {
        patientName: 'Unknown', patientId: 'Unknown', modality: 'Unknown',
        bodyPartExamined: 'Unknown', studyDate: 'Unknown', studyInstanceUID: studyId,
        studyDescription: 'Unknown', institutionName: 'Unknown', rows: null, columns: null,
      };
    }

    const analysis = await analyzeImage(buffer, metadata);
    const triage = computeTriage(analysis.findings || []);
    const processingTimeMs = Date.now() - startTime;

    try {
      await Study.create({
        patientName: metadata.patientName,
        patientId: metadata.patientId,
        modality: metadata.modality,
        bodyPart: metadata.bodyPartExamined,
        studyDate: metadata.studyDate,
        studyInstanceUID: metadata.studyInstanceUID,
        studyDescription: metadata.studyDescription,
        institutionName: metadata.institutionName,
        imageSize: { rows: metadata.rows, columns: metadata.columns },
        status: 'completed',
        analysis,
        triage,
        processingTimeMs,
      });
    } catch (dbErr) {
      logger.warn(`MongoDB save skipped: ${dbErr.message}`);
    }

    res.json({
      studyId,
      study: {
        patientName: metadata.patientName,
        patientId: metadata.patientId,
        modality: metadata.modality,
        bodyPart: metadata.bodyPartExamined,
        studyDate: metadata.studyDate,
        studyInstanceUID: metadata.studyInstanceUID,
      },
      analysis: {
        model: analysis.model,
        findings: analysis.findings,
        normalProbability: analysis.normalProbability,
      },
      triage,
      audit: {
        processingTimeMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
