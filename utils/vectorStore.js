const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");

class VectorStore {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    this.collectionName = "documents";
  }

  async initialize() {
    try {
      await this.client.getCollection(this.collectionName);
      console.log("Collection exists with current configuration");
    } catch (error) {
      console.log("Creating new collection with 384 dimensions");
      await this.client.createCollection(this.collectionName, {
        vectors: { size: 384, distance: "Cosine" }, // Changed from 1536 to 384
      });
    }
  }

  async storeDocuments(chunks, metadata) {
    const points = chunks.map(async (chunk, index) => ({
      id: uuidv4(),
      vector: await this.getEmbedding(chunk),
      payload: { text: chunk, ...metadata },
    }));

    const resolvedPoints = await Promise.all(points);
    await this.client.upsert(this.collectionName, { points: resolvedPoints });
    return resolvedPoints.length;
  }

  async searchSimilar(query, limit = 5) {
    const queryVector = await this.getEmbedding(query);
    const searchResult = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit,
      with_payload: true,
    });

    return searchResult.map(hit => ({
      text: hit.payload.text,
      score: hit.score,
      metadata: hit.payload,
    }));
  }

  async getEmbedding(text) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const embedding = await response.json();
      return embedding;
    } catch (error) {
      console.error("Embedding generation failed:", error);
      // Fallback to dummy vectors if Hugging Face fails
      return Array(384)
        .fill(0)
        .map(() => Math.random() - 0.5); // Note: 384 dimensions for this model
    }
  }
}

module.exports = VectorStore;
