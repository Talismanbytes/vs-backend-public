// backend/src/routes/health.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Volkrin Stream backend healthy ✅" });
});

module.exports = router;
