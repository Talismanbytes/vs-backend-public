const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String },
    fileKey: { type: String, required: true }, // S3 object key
    audioUrl: { type: String, required: true }, // Public or signed URL
    thumbnailUrl: { type: String, required: true }, // S3 thumbnail
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Track", trackSchema);
