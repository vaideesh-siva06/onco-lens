// redisClient.js
import { createClient } from "redis";

const redisUrl =
  process.env.REDIS_URL || "redis://red-d652pd6r433s73aghbe0:6379"; // fallback for docker-compose

const redis = createClient({
  url: redisUrl,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

await redis.connect();

export default redis;
