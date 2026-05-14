import pino from 'pino';
import { config, isProd } from '../config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.password_hash',
      '*.refresh_token',
      '*.access_token',
      '*.JWT_SECRET',
      '*.GMAIL_APP_PASSWORD',
      '*.GEMINI_API_KEY',
      '*.S3_SECRET_KEY',
    ],
    censor: '[REDACTED]',
  },
});
