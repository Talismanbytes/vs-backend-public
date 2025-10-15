// backend/src/testRedis.js
require("dotenv").config({ path: __dirname + "/../.env" }); // Load .env from backend root
const Redis = require("ioredis");

// Connect to Upstash using .env
const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: { rejectUnauthorized: false }, // Upstash requires TLS
});

redis.on("connect", () => console.log("✅ Connected to Upstash Redis"));
redis.on("error", (err) => console.error("❌ Redis Error:", err));

(async () => {
  try {
    // 1. Write value
    await redis.set("volkrin:test", "Hello Volkrin 🚀", "EX", 30);

    // 2. Read value
    const value = await redis.get("volkrin:test");
    console.log("✅ Redis GET:", value);

    // 3. Delete value
    await redis.del("volkrin:test");
    const deletedValue = await redis.get("volkrin:test");
    console.log("✅ After DEL:", deletedValue); // should be null

    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
})();
