import { createClient } from 'redis';

// Using default url for Redis server
// I use VPS and have Redis running on the same server so it's the same as developing in local
// Replace this with your Redis server URL if it's different
const redis = createClient({
  url: 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log('Connected to Redis');
  }
};

export default redis;
