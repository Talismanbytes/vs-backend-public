const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/s3");
const Track = require("../models/Track");
const generatePresignedUrl = require("../utils/generatePresignedUrl");
const client = require("prom-client");
const cache = require("../utils/cache");   // 👈 Redis cache

// ===============================
// Prometheus Custom Metrics
// ===============================
const trackUploadCounter = new client.Counter({
  name: "volkrin_track_uploads_total",
  help: "Total number of tracks uploaded successfully",
});
const trackDeleteCounter = new client.Counter({
  name: "volkrin_track_deletions_total",
  help: "Total number of track deletions",
});
// ===============================
// Multer in-memory storage
// ===============================
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// Upload Track (Audio + Thumbnail) -> S3
// ===============================
exports.uploadTrack = [
  upload.fields([{ name: "file" }, { name: "thumbnail" }]),
  async (req, res) => {
    try {
      console.log("DEBUG Upload Route - req.files:", req.files);
      console.log("DEBUG Upload Route - req.body:", req.body);

      const { title, artist } = req.body;
      const audioFile = req.files?.file?.[0];
      const thumbFile = req.files?.thumbnail?.[0];

      if (!title || !audioFile || !thumbFile) {
        return res.status(400).json({
          message: "Title, audio, and thumbnail are required",
        });
      }

        const sanitize = (filename) => filename.replace(/\s+/g, "_"); // replace spaces with _
        const audioKey = `audio/${uuidv4()}-${sanitize(audioFile.originalname)}`;
        const thumbKey = `thumbnails/${uuidv4()}-${sanitize(thumbFile.originalname)}`;
        console.log("DEBUG Audio Key:", audioKey);
        console.log("DEBUG Thumbnail Key:", thumbKey);

      // Upload audio
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: audioKey,
          Body: audioFile.buffer,
          ContentType: audioFile.mimetype,
        })
      );

      // Upload thumbnail
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: thumbKey,
          Body: thumbFile.buffer,
          ContentType: thumbFile.mimetype,
        })
      );

      const audioUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;
      const thumbnailUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbKey}`;

      const track = await Track.create({
        title,
        artist,
        fileKey: audioKey,
        audioUrl,
        thumbnailUrl,
        uploadedBy: req.user?.id || null, // requires auth middleware
      });

      // ✅ Increment Prometheus counter
      trackUploadCounter.inc();

      // ✅ Invalidate track list cache
      await cache.del("tracks:all");

      res.status(201).json({
        message: "Track uploaded successfully",
        track,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed: " + error.message });
    }
  },
];

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

// ===============================
// Delete Track (Admin Only)
// ===============================
exports.deleteTrack = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Delete audio + thumbnail from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: track.fileKey,
    }));
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: track.thumbnailUrl.split(".amazonaws.com/")[1], // extract key from URL
    }));

    // Delete from MongoDB
    await track.deleteOne();

    // ✅ Increment deletion counter
    trackDeleteCounter.inc();
    
    // Invalidate cache
    await cache.del("tracks:all");

    res.json({ message: "Track deleted successfully" });
  } catch (error) {
    console.error("Delete Track Error:", error);
    res.status(500).json({ message: error.message });
  }
};



// ===============================
// List All Tracks (with Redis caching)
// ===============================
exports.listTracks = async (req, res) => {
  try {
    const cacheKey = "tracks:all";

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log("⚡ Cache hit: listTracks");
      return res.json(cached);
    }

    console.log("🐢 Cache miss: listTracks");
    const tracks = await Track.find().populate("uploadedBy", "email role");

    // Save to cache (TTL = 600s or 9 mins change it accordingly)
    await cache.set(cacheKey, tracks, 600);

    res.json(tracks);
  } catch (error) {
    console.error("List Tracks Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Get Track Streaming URL (Presigned, cached)
// ===============================
exports.getTrackUrl = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ message: "Track not found" });

    const cacheKey = `track:url:${track._id}`;
    const cachedUrl = await cache.get(cacheKey);

    if (cachedUrl) {
      console.log("⚡ Cache hit: getTrackUrl");
      return res.json({ url: cachedUrl });
    }

    console.log("🐢 Cache miss: getTrackUrl");
    const url = await generatePresignedUrl(track.fileKey);

    // Cache URL for 5 mins
    await cache.set(cacheKey, url, 300);

    res.json({ url });
  } catch (error) {
    console.error("Get Track URL Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Mock Upload (DEV ONLY)
// ===============================
exports.mockUploadTrack = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(400)
        .json({ message: "Mock upload disabled in production" });
    }

    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({
        message: "Title and artist are required",
      });
    }

    const fakeTrack = {
      _id: Date.now().toString(),
      title,
      artist,
      fileKey: "mock-file-key.mp3",
      uploadedBy: "mock-user",
      audioUrl: `http://localhost:8000/fake/${title.replace(/\s+/g, "")}.mp3`,
      thumbnailUrl: "http://localhost:8000/fake/thumb.jpg",
    };

    res.status(201).json({
      message: "Track uploaded successfully (mock)",
      track: fakeTrack,
    });
  } catch (error) {
    console.error("Mock Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};
