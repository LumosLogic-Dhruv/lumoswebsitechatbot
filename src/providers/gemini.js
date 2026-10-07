const { GoogleGenerativeAI } = require('@google/generative-ai');

let client;
function getClient() {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function askGemini(message, history, systemPrompt) {
  const geminiHistory = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = getClient().getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      });

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(message);
      return { text: result.response.text(), model: modelName };
    } catch (err) {
      const isOverloaded = err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('overloaded');
      if (isOverloaded && modelName !== GEMINI_MODELS.at(-1)) {
        console.warn(`[Gemini] ${modelName} overloaded, trying ${GEMINI_MODELS[GEMINI_MODELS.indexOf(modelName) + 1]}`);
        continue;
      }
      throw err;
    }
  }
}

module.exports = { askGemini };
