const express = require("express");
const {
  uploadTrack,
  listTracks,
  getTrackUrl,
  mockUploadTrack,
  deleteTrack
} = require("../controllers/trackController");

const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();



// ✅ Only admin can upload real tracks
router.post("/upload", auth, isAdmin, ...uploadTrack);

// ✅ Mock upload (for dev only)
router.post("/mock-upload", mockUploadTrack);

// ✅ Public: List all tracks
router.get("/", listTracks);

// ✅ Public: Stream track (get presigned URL)
router.get("/:id/stream", getTrackUrl);

// ✅ Admin: Delete track
router.delete("/:id", auth, isAdmin, deleteTrack);

module.exports = router;
