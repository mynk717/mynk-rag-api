const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "RAG API is running!",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/upload", (req, res) => {
  res.json({ message: "Upload endpoint - coming soon" });
});

app.post("/api/query", (req, res) => {
  const { question } = req.body;
  res.json({
    message: "Query endpoint - coming soon",
    question: question || "No question provided",
  });
});

// Export for Vercel
module.exports = app;
