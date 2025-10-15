require("dotenv").config();
const { S3Client } = require("@aws-sdk/client-s3");

console.log("DEBUG S3 INIT:");
console.log(" - Region:", process.env.AWS_REGION);
console.log(" - Bucket:", process.env.S3_BUCKET);
console.log(" - Key:", process.env.AWS_ACCESS_KEY_ID?.slice(0, 4) + "****");
console.log(" - Secret:", process.env.AWS_SECRET_ACCESS_KEY ? "Loaded" : "Missing");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3;
