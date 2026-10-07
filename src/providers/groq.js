const Groq = require('groq-sdk');

let client;
function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

async function askGroq(message, history, systemPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const completion = await getClient().chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  return completion.choices[0].message.content;
}

module.exports = { askGroq };
