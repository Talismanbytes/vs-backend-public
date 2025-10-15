require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

(async () => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: "test-file.txt",
      Body: "Hello Volkrin Stream 🚀",
      ContentType: "text/plain",
    };

    const result = await s3.send(new PutObjectCommand(params));
    console.log("✅ Test upload succeeded:", result);
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
  }
})();
