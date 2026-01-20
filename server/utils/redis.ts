import Redis from 'ioredis';

const connectionString = process.env.KV_URL || process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(connectionString);

export default redis;
