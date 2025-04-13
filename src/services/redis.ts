import { createClient } from 'redis';

const redis = createClient({
  url: 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('❌ Redis error:', err));

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log('✅ Connected to Redis');
  }
};

export default redis;
