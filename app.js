import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import cors from "cors";
import fs from "fs/promises";
import { extractRelevantData } from "./relevantData.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Request logging middleware
app.use((req, res, next) => {
  next();
});

app.use(cors());
app.use(express.json());

let portfolioData = null;

// Load data
async function loadPortfolioData() {
  try {
    const data = await fs.readFile("./data/portfolio.json", "utf-8");
    portfolioData = JSON.parse(data);
  } catch (err) {
    // Error loading portfolio data handled silently
  }
}

function normalizeInput(msg) {
  return msg.replace(/\btanishq\b/gi, "Tanishk");
}

// GROQ CLIENT
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/chat", async (req, res) => {
  const requestId = Date.now();

  try {
    let { userMessage } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: "Message required" });
    }

    userMessage = normalizeInput(userMessage);

    if (!portfolioData) {
      return res.status(500).json({ error: "Data not loaded" });
    }

    const relevantData = extractRelevantData(userMessage, portfolioData);

    const groqStartTime = Date.now();

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "You are Tanishk's AI assistant. Speak in a friendly , funny , light-hearted way . Only use the provided portfolio data. If you don't know something, say so with a light humorous touch.",
        },
        {
          role: "system",
          content: `Relevant Portfolio Data: ${JSON.stringify(relevantData)}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const groqEndTime = Date.now();
    const groqDuration = groqEndTime - groqStartTime;
    const aiResponse = completion.choices[0].message.content;

    const responseData = { response: aiResponse };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({
      error: "Groq API failed",
      details: err.message,
      requestId: requestId,
    });
  }
});

//isme paisa lgne lga jo mere pass hai nahi toh hta diya
// app.post("/tts", async (req, res) => {
//   try {
//     const { text } = req.body;

//     if (!text || !text.trim()) {
//       return res.status(400).json({ error: "Text is required" });
//     }

//     const response = await fetch(
//       "https://api.groq.com/openai/v1/audio/speech",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "playai-tts",
//           voice: "Fritz-PlayAI",
//           input: text,
//           response_format: "wav",
//         }),
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response.text();
//       console.error("Groq TTS API Error:", errorData);

//       return res.status(500).json({
//         error: "Groq TTS request failed",
//         details: errorData,
//       });
//     }

//     const arrayBuffer = await response.arrayBuffer();
//     const base64Audio = Buffer.from(arrayBuffer).toString("base64");

//     res.json({
//       success: true,
//       audio: base64Audio,
//       format: "wav",
//     });
//   } catch (err) {
//     console.error("TTS Error:", err);
//     res.status(500).json({
//       error: "Groq TTS failed",
//       details: err.message,
//     });
//   }
// });

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    portfolioLoaded: !!portfolioData,
    groqConfigured: !!process.env.GROQ_API_KEY,
  });
});

async function start() {
  await loadPortfolioData();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start();
