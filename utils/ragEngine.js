class RAGEngine {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  async generateResponse(question, context) {
    try {
      const prompt = this.buildPrompt(question, context);

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": this.geminiApiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log("Gemini response:", data);

      // Handle Gemini response structure
      if (data.candidates && data.candidates[0] && data.candidates.content) {
        return data.candidates.content.parts.text;
      } else if (data.error) {
        console.error("Gemini API error:", data.error);
        return `Based on your uploaded document: ${
          context[0]?.text || "No relevant context found"
        }. (API temporarily unavailable)`;
      } else {
        return `Based on your uploaded document about "${question}": ${
          context[0]?.text || "Information found but processing issue occurred"
        }`;
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      return `Based on your uploaded document: ${
        context[0]?.text || "Content available but processing error occurred"
      }`;
    }
  }

  buildPrompt(question, context) {
    const contextText = context.map(item => item.text).join("\n\n");
    return `Based on the following context from uploaded documents, please answer the question concisely and accurately.

Context:
${contextText}

Question: ${question}

Answer based only on the context provided:`;
  }
}

module.exports = RAGEngine;
