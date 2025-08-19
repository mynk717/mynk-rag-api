const fs = require("fs");
const csv = require("csv-parser");
const pdf = require("pdf-parse");

class FileProcessor {
  async processPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return this.chunkText(data.text);
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", data => results.push(data))
        .on("end", () => {
          const text = results
            .map(row => Object.values(row).join(" "))
            .join("\n");
          resolve(this.chunkText(text));
        })
        .on("error", reject);
    });
  }

  chunkText(text, chunkSize = 500, overlap = 50) {
    const words = text.split(" ");
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      if (chunk.trim()) chunks.push(chunk);
    }

    return chunks;
  }
}

module.exports = FileProcessor;
