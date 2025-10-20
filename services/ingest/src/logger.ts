import pino from 'pino';

export const logger = pino({
  name: 'smartbundle-ingest',
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, singleLine: true },
        }
      : undefined,
});

export type Logger = typeof logger;
