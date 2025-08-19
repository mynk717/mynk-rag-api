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
    } catch (error) {
      await this.client.createCollection(this.collectionName, {
        vectors: { size: 1536, distance: "Cosine" },
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
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-ada-002",
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw error;
    }
  }
}

module.exports = VectorStore;
