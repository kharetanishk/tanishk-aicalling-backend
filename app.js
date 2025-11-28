import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import fs from "fs/promises";
import { extractRelevantData } from "./relevantData.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "*", // or restrict later
  })
);

app.use(express.json());

// Load portfolio data once
let portfolioData = null;

async function loadPortfolioData() {
  try {
    const data = await fs.readFile("./data/portfolio.json", "utf-8");
    portfolioData = JSON.parse(data);
    console.log("✔ Portfolio data loaded");
  } catch (error) {
    console.error("Error loading portfolio data:", error);
  }
}

// Normalize name typos
function normalizeInput(input) {
  return input.replace(/\btanishq\b/gi, "Tanishk");
}

// OpenAI setup
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    let { userMessage } = req.body;

    if (!userMessage || userMessage.trim() === "") {
      return res.status(400).json({ error: "userMessage is required" });
    }

    userMessage = normalizeInput(userMessage);

    if (!portfolioData) {
      return res.status(500).json({ error: "Portfolio data not loaded" });
    }

    // Extract relevant data for the query
    const relevantData = extractRelevantData(userMessage, portfolioData);

    // Generate answer
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 150,

      messages: [
        {
          role: "system",
          content:
            "You are Tanishk’s AI assistant. Speak in a friendly, slightly witty tone. Only use the provided portfolio data. If you don't know something, say so with a light humorous touch.",
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

    const reply =
      completion.choices?.[0]?.message?.content || "I am speechless 😄";

    res.json({ response: reply });
  } catch (error) {
    console.error("OpenAI Error:", error);

    res.status(500).json({
      error: "OpenAI API error",
      details: error?.message,
    });
  }
});

// Start server
async function start() {
  await loadPortfolioData();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(` AI Portfolio Server running at http://localhost:${PORT}`);
  });
}

start();
