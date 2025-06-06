import express, { response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import fs from "fs/promises";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load portfolio data from file
let portfolioData = null;

async function loadPortfolioData() {
  try {
    const data = await fs.readFile("./data/portfolio.json", "utf-8");
    portfolioData = JSON.parse(data);
    console.log("Portfolio data loaded successfully");
  } catch (error) {
    console.error(" Error reading portfolio data:", error);
  }
}

// Chat route
app.post("/chat", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "userMessage is required" });
  }

  if (!portfolioData) {
    return res.status(500).json({ error: "Portfolio data not loaded" });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant for Tanishk Khare's portfolio website. ONLY answer questions based on the portfolio data provided below. If the answer is not present in the data, respond with 'I don’t have that information.' Do not guess or make up anything.",
        },
        {
          role: "system",
          content: `Portfolio Data: ${JSON.stringify(portfolioData)}`,
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    res.json({ response: reply });
  } catch (error) {
    if (error.response) {
      console.error("OpenAI API Error Status:", error.response.status);
      console.error("OpenAI API Error Data:", error.response.data);
    } else {
      console.error("OpenAI API Error:", error.message);
    }
    res.status(500).json({ error: "OpenAI API error" });
  }
});

// Start server
async function startServer() {
  await loadPortfolioData();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
