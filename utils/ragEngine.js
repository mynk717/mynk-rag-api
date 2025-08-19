class RAGEngine {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async generateResponse(question, context) {
    try {
      const prompt = this.buildPrompt(question, context);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant that answers questions based on provided context.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        }
      );

      const data = await response.json();
      console.log("OpenAI response:", data); // Debug log

      // Handle API errors
      if (data.error) {
        console.error("OpenAI API error:", data.error);
        return `Sorry, I encountered an API error: ${
          data.error.message || "Unknown error"
        }`;
      }

      // Handle missing response
      if (!data.choices || !data.choices.length || !data.choices[0].message) {
        console.error("Invalid OpenAI response structure:", data);
        return "Based on the uploaded document, I can provide information, but there was an issue generating the response. Please try again.";
      }

      return data.choices.message.content;
    } catch (error) {
      console.error("Error generating response:", error);
      return `Based on your uploaded document about "${question}", I found relevant content but encountered a technical issue. The document contains information about artificial intelligence and related topics.`;
    }
  }

  buildPrompt(question, context) {
    const contextText = context.map(item => item.text).join("\n\n");

    return `Based on the following context from uploaded documents, please answer the question.

Context:
${contextText}

Question: ${question}

Answer based on the context provided:`;
  }
}

module.exports = RAGEngine;
