// backend/src/config/redis.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // force load env here

const Redis = require("ioredis");

// Debug log
console.log("DEBUG Redis URL present:", !!process.env.UPSTASH_REDIS_URL);

let redis;

if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_URL.startsWith("rediss://")) {
  // ✅ Upstash Redis (TLS required)
  redis = new Redis(process.env.UPSTASH_REDIS_URL, {
    tls: { rejectUnauthorized: false },
  });
  console.log("🔗 Using Upstash Redis");
} else {
  // ✅ Local Redis fallback (only if Upstash var missing)
  redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  });
  console.log("🔗 Using Local Redis");
}

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis Error:", err.message));

module.exports = redis;
