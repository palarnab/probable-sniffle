import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

let analysisNamespace;

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  analysisNamespace = io.of('/analysis');

  analysisNamespace.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info('Socket.IO initialised on /analysis namespace');
  return io;
}

export function emitAnalysisUpdate(event, data) {
  if (!analysisNamespace) return;
  analysisNamespace.emit(event, data);
}
