import http from 'node:http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocket } from './socket/index.js';

import healthRouter from './routes/health.js';
import analyzeRouter from './routes/analyze.js';
import studiesRouter from './routes/studies.js';
import volumesRouter from './routes/volumes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trimEnd()) },
}));
app.use(express.json({ limit: '50mb' }));

app.use(rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/volumes', volumesRouter);

app.use(errorHandler);

const server = http.createServer(app);
setupSocket(server);

async function start() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.warn(`MongoDB unavailable — running without database: ${err.message}`);
  }

  server.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port} [${config.nodeEnv}]`);
  });
}

function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    try { await mongoose.disconnect(); } catch { /* ignore */ }
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
