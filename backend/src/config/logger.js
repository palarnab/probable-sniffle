import fs from 'node:fs';
import winston from 'winston';
import { config } from './index.js';

fs.mkdirSync(config.logDir, { recursive: true });

const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: { service: 'radiology-copilot' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: `${config.logDir}/error.log`,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: `${config.logDir}/combined.log`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});

export { logger };
