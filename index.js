import express from "express";
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
function normalizeInput(input) {
  return input.replace(/\bTanishq\b/gi, "Tanishk");
}
// Chat route
app.post("/chat", async (req, res) => {
  let { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "userMessage is required" });
  }
  userMessage = normalizeInput(userMessage);

  if (!portfolioData) {
    return res.status(500).json({ error: "Portfolio data not loaded" });
  }
  const summarizedData = {
    name: portfolioData?.bio?.name || "",
    role: portfolioData?.bio?.role || "",
    about: portfolioData?.bio?.summary || "",
    skills: [
      ...(portfolioData?.skills?.languages || []),
      ...(portfolioData?.skills?.frameworks || []),
      ...(portfolioData?.skills?.databases || []),
      ...(portfolioData?.skills?.tools || []),
    ],
    projects: (portfolioData?.projects || []).map((p) => ({
      title: p.title || "",
    })),
    education: (portfolioData?.education || []).map((e) => ({
      degree: e.degree || "",
      institution: e.institution || "",
      duration: e.duration || "",
    })),
    contact: portfolioData?.contact || "",
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are Tanishk’s AI. Use only the data below. If missing, reply: “I don’t have that information",
        },
        {
          role: "system",
          content: `Portfolio Data: ${JSON.stringify(summarizedData)})}`,
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 130,
      temperature: 0.4,
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
