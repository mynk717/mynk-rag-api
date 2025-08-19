const express = require("express");
const multer = require("multer");
const cors = require("cors");
const FileProcessor = require("../utils/fileProcessor");
const VectorStore = require("../utils/vectorStore");
const RAGEngine = require("../utils/ragEngine");

const app = express();
const upload = multer({ dest: "/tmp/" });

// Initialize services
const fileProcessor = new FileProcessor();
const vectorStore = new VectorStore();
const ragEngine = new RAGEngine();

app.use(cors());
app.use(express.json());

// Initialize vector database
vectorStore.initialize().catch(console.error);

app.get("/", (req, res) => {
  res.json({
    message: "RAG API is running!",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // ADD THIS LINE FOR DEBUGGING:
    console.log("Uploaded file mimetype:", file.mimetype);
    console.log("File details:", { name: file.originalname, size: file.size });

    let chunks;
    // UPDATED FILE TYPE HANDLING:
    if (file.mimetype === "application/pdf") {
      chunks = await fileProcessor.processPDF(file.path);
    } else if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/csv" ||
      file.mimetype === "application/octet-stream"
    ) {
      chunks = await fileProcessor.processCSV(file.path);
    } else if (file.mimetype === "text/plain") {
      const fs = require("fs");
      const text = fs.readFileSync(file.path, "utf8");
      chunks = fileProcessor.chunkText(text);
    } else {
      return res.status(400).json({
        error: `Unsupported file type: ${file.mimetype}`,
      });
    }

    const count = await vectorStore.storeDocuments(chunks, {
      filename: file.originalname,
      uploadDate: new Date().toISOString(),
    });

    res.json({
      message: "File processed successfully",
      chunksStored: count,
      filename: file.originalname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "No question provided" });

    const context = await vectorStore.searchSimilar(question);
    const answer = await ragEngine.generateResponse(question, context);

    res.json({
      question,
      answer,
      sources: context.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
