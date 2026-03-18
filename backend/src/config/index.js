import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT, 10) || 4001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4002',

  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:4000',
  aiServiceTimeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 30000,

  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50,
  maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * 1024 * 1024,

  maxVolumeFileSizeMb: parseInt(process.env.MAX_VOLUME_FILE_SIZE_MB, 10) || 2048,
  maxVolumeFileSizeBytes: (parseInt(process.env.MAX_VOLUME_FILE_SIZE_MB, 10) || 2048) * 1024 * 1024,

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/radiology-copilot',

  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT, 10) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || '',

  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',

  jwtSecret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
};
