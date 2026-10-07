require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SYSTEM_PROMPT } = require('./context');
const { askGroq } = require('./providers/groq');

const app = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
  'https://lumoslogic.com',
  'https://www.lumoslogic.com',
  'https://lumos-logic-enchant.web.app',
  'https://lumos-logic-enchant.firebaseapp.com',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, Cloud Run health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '16kb' }));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lumoslogic-chatbot-api', region: 'asia-south1' });
});

// ── Chat endpoint ───────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const { message, userName, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message is required and must be a non-empty string' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'message too long (max 2000 chars)' });
  }

  // Prepend the user's name to give the AI context
  const enriched = userName ? `[The user's name is ${userName}] ${message.trim()}` : message.trim();

  // Keep only last 10 turns to avoid token bloat
  const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

  // ── Groq only (Gemini disabled) ─────────────────────────────────────────
  try {
    const reply = await askGroq(enriched, trimmedHistory, SYSTEM_PROMPT);
    return res.json({ reply, model: 'groq-gpt-oss-120b' });
  } catch (groqErr) {
    console.error('[Groq] failed:', groqErr.message);
    return res.status(503).json({
      reply: "I'm having a little trouble right now. Please try again in a moment, or reach us directly at hello@lumoslogic.com or +91 7984774840.",
      model: 'fallback',
    });
  }
});

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'not found' }));

app.listen(PORT, () => {
  console.log(`✅ Lumos Logic Chatbot API listening on port ${PORT}`);
});
