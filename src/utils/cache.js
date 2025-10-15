// backend/src/utils/cache.js
const redis = require("../config/redis");

const cache = {
  // Get cached value
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`❌ Redis GET error [${key}]:`, err.message);
      return null;
    }
  },

  // Set cached value with optional TTL
  async set(key, value, ttlSec) {
    try {
      const strValue = JSON.stringify(value);
      if (ttlSec) {
        await redis.set(key, strValue, "EX", ttlSec);
      } else {
        await redis.set(key, strValue);
      }
      console.log(`✅ Cached key: ${key} (TTL: ${ttlSec || "∞"})`);
    } catch (err) {
      console.error(`❌ Redis SET error [${key}]:`, err.message);
    }
  },

  // Delete a cached key
  async del(key) {
    try {
      await redis.del(key);
      console.log(`🗑️ Deleted cache key: ${key}`);
    } catch (err) {
      console.error(`❌ Redis DEL error [${key}]:`, err.message);
    }
  },
};

module.exports = cache;
