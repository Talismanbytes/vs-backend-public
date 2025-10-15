// backend/src/app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const promBundle = require("express-prom-bundle");

// Route imports
const authRoutes = require("./routes/auth");
const trackRoutes = require("./routes/tracks");
const healthRoutes = require("./routes/health");

const app = express();

// Prometheus middleware
const metricsMiddleware = promBundle({ includeMethod: true, includePath: true });
app.use(metricsMiddleware);
// Middlewares
app.use(cors()); // allow frontend calls
app.use(express.json()); // parse JSON body
app.use(morgan("dev")); // request logging

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/health", healthRoutes);

// Fallback route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
