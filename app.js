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
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.path}`);
  console.log("📍 Origin:", req.headers.origin || "N/A");
  console.log("🌐 User-Agent:", req.headers["user-agent"] || "N/A");
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
    console.log("✔ Portfolio data loaded");
  } catch (err) {
    console.error("Error loading portfolio data:", err);
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
  const timestamp = new Date().toISOString();

  try {
    // Log incoming request
    console.log("\n" + "=".repeat(80));
    console.log(`📥 [${timestamp}] INCOMING REQUEST #${requestId}`);
    console.log("=".repeat(80));
    console.log("📍 Endpoint:", req.method, req.path);
    console.log("🌐 IP:", req.ip || req.connection.remoteAddress);
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
    console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));

    let { userMessage } = req.body;
    if (!userMessage) {
      console.error("❌ [REQUEST #" + requestId + "] Error: Message required");
      console.log("=".repeat(80) + "\n");
      return res.status(400).json({ error: "Message required" });
    }

    console.log("💬 Original User Message:", userMessage);
    userMessage = normalizeInput(userMessage);
    console.log("✏️  Normalized User Message:", userMessage);

    if (!portfolioData) {
      console.error(
        "❌ [REQUEST #" + requestId + "] Error: Portfolio data not loaded"
      );
      console.log("=".repeat(80) + "\n");
      return res.status(500).json({ error: "Data not loaded" });
    }

    const relevantData = extractRelevantData(userMessage, portfolioData);
    console.log(
      "🔍 Relevant Data Extracted:",
      JSON.stringify(relevantData, null, 2)
    );

    // Log Groq API call
    const groqStartTime = Date.now();
    console.log("\n🤖 Calling Groq API...");
    console.log("📤 Groq Request Config:", {
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 150,
      messageCount: 3,
    });

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "You are Tanishk's AI assistant. Speak in a friendly, slightly witty tone. Only use the provided portfolio data. If you don't know something, say so with a light humorous touch.",
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

    // Log Groq API response
    console.log("✅ Groq API Response Received");
    console.log("⏱️  Groq API Duration:", groqDuration + "ms");
    console.log("📊 Usage:", JSON.stringify(completion.usage, null, 2));
    console.log("🤖 AI Response:", aiResponse);
    console.log("📏 Response Length:", aiResponse.length, "characters");

    // Log outgoing response
    const responseData = { response: aiResponse };
    console.log("\n📤 [REQUEST #" + requestId + "] SENDING RESPONSE");
    console.log("📦 Response Data:", JSON.stringify(responseData, null, 2));
    console.log("✅ Status: 200 OK");
    console.log("=".repeat(80) + "\n");

    res.json(responseData);
  } catch (err) {
    const errorTimestamp = new Date().toISOString();

    // Always log errors, but less verbose in production
    if (isDevelopment) {
      console.error("\n" + "=".repeat(80));
      console.error(`❌ [${errorTimestamp}] ERROR IN REQUEST #${requestId}`);
      console.error("=".repeat(80));
      console.error("🔴 Error Type:", err.constructor.name);
      console.error("📝 Error Message:", err.message);
      console.error("📚 Error Stack:", err.stack);

      if (err.response) {
        console.error("📡 HTTP Response Status:", err.response.status);
        console.error("📡 HTTP Response Data:", err.response.data);
      }

      if (err.request) {
        console.error("📡 Request Details:", err.request);
      }

      console.error("=".repeat(80) + "\n");
    } else {
      // Production: minimal error logging
      console.error(`[${errorTimestamp}] Error #${requestId}:`, err.message);
    }

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
    console.log("\n" + "=".repeat(80));
    console.log("🚀 SERVER STARTED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log("📍 Port:", PORT);
    console.log("🌐 Environment:", process.env.NODE_ENV || "development");
    console.log("⏰ Started at:", new Date().toISOString());
    console.log(
      "📊 Portfolio Data:",
      portfolioData ? "✅ Loaded" : "❌ Not loaded"
    );
    console.log(
      "🤖 Groq API:",
      process.env.GROQ_API_KEY ? "✅ Configured" : "❌ Not configured"
    );
    console.log("💾 Compression:", "✅ Enabled");
    console.log("=".repeat(80) + "\n");
  });
}

start();
