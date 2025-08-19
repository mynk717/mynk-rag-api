class RAGEngine {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async generateResponse(question, context) {
    const prompt = this.buildPrompt(question, context);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    const data = await response.json();
    return data.choices.message.content;
  }

  buildPrompt(question, context) {
    return `Based on the following context, please answer the question.
        
Context:
${context.map(item => item.text).join("\n\n")}

Question: ${question}

Answer:`;
  }
}

module.exports = RAGEngine;
