import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const MONGO_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

router.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState;

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: MONGO_STATES[dbState] || 'disconnected',
      aiService: 'unknown',
    },
  });
});

export default router;
