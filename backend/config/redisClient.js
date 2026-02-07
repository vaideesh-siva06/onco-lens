// redisClient.js
import { createClient } from "redis";

const redis = createClient({
  url: 'redis://redis:6379'
});

redis.on("error", (err) => console.error("Redis error:", err));

await redis.connect();

export default redis;
