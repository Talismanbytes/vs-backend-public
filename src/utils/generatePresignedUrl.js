const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { parseUrl } = require("@aws-sdk/url-parser");
const s3 = require("../config/s3");

const generatePresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  const presigner = new S3RequestPresigner({ ...s3.config });
  const url = await presigner.presign(command, { expiresIn: 300 }); // 5 mins
  return url;
};

module.exports = generatePresignedUrl;
