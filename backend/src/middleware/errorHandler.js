import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, _req, res, _next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err.name === 'ValidationError' && err.errors) {
    const fields = Object.entries(err.errors).map(([field, detail]) => ({
      field,
      message: detail.message,
    }));
    return res.status(400).json({
      error: { message: 'Validation failed', status: 400, fields },
    });
  }

  if (err.name === 'MulterError') {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      error: { message: err.message, status, code: err.code },
    });
  }

  const status = err.status || err.statusCode || 500;
  const body = {
    error: {
      message: status === 500 ? 'Internal server error' : err.message,
      status,
      ...(config.isDev && { stack: err.stack }),
    },
  };

  res.status(status).json(body);
}
