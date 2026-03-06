import { Router } from 'express';
import mongoose from 'mongoose';
import { Study } from '../models/Study.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const studies = await Study.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(studies);
  } catch (err) {
    logger.warn(`Failed to list studies: ${err.message}`);
    res.json([]);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: { message: 'Database unavailable', status: 503 } });
    }
    const study = await Study.findById(req.params.id).lean();
    if (!study) {
      return res.status(404).json({ error: { message: 'Study not found', status: 404 } });
    }
    res.json(study);
  } catch (err) {
    next(err);
  }
});

export default router;
