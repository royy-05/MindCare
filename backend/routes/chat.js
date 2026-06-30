const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../middlewares/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for chatbot to prevent API quota abuse
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP/user to 30 chat messages per hour
  message: {
    reply: "⚠️ You have reached your hourly chat limit. Please take a break and try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Initialize Gemini with System Instructions for mental health support safety
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: "You are MindCare AI, a supportive, empathetic, and professional mental health AI assistant. Your role is to listen actively, offer healthy coping strategies, grounding exercises, and support for stress, anxiety, or depression. You must not provide clinical diagnoses, prescribe medication, or give medical advice. If a user mentions self-harm, suicide, or severe crisis, you must immediately provide crisis helpline numbers (e.g., Suicide & Crisis Lifeline: 988) and urge them to contact professional help or emergency services. Keep your responses concise, warm, and structured with paragraphs or bullet points for readability."
});

// POST /api/chat
router.post("/", authMiddleware, chatLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "⚠️ No message provided." });
    }

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ reply: "⚠️ Something went wrong with Gemini API." });
  }
});

module.exports = router;