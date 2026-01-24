export const invalidateProjectLists = async (redis) => {
    try {
        for await (const key of redis.scanIterator({
            MATCH: "projects:user:*"
        })) {
            await redis.del(key);
        }
    } catch (err) {
        console.warn("Redis list invalidation failed:", err);
    }
};

export const invalidateProject = async (redis, projectId) => {
    try {
        await redis.del(`project:${projectId}`);
    } catch (err) {
        console.warn("Redis project invalidation failed:", err);
    }
};

export async function invalidateMeetingCache(redis, meeting) {
    if (!meeting) return;

    // Invalidate admin cache
    await redis.del(`meeting:${meeting.admin}`);

    // Invalidate cache for all participants
    if (meeting.invitees && meeting.invitees.length > 0) {
        for (const participant of meeting.invitees) {
            await redis.del(`meeting:${participant}`);
        }
    }
}

export const invalidateDocumentCacheForUser = async (redisClient, userId) => {
  try {
    // Assuming your document cache key is like `documents:<userId>`
    const key = `documents:${userId}`;
    await redisClient.del(key);
    console.log(`Redis cache cleared for user ${userId}`);
  } catch (err) {
    console.error("Failed to invalidate document cache:", err);
  }
};