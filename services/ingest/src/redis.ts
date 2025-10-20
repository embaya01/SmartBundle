import { RedisOptions } from 'ioredis';
import { ConnectionOptions } from 'bullmq';

const {
  REDIS_HOST = '127.0.0.1',
  REDIS_PORT = '6379',
  REDIS_USERNAME,
  REDIS_PASSWORD,
} = process.env;

const baseOptions: RedisOptions = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

export const redisConnection: ConnectionOptions = baseOptions;
