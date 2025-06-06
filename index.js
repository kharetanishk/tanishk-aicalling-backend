import express from "express";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/chat", async (req, res) => {
  const { userMessage, portfolioData } = req.body;

  try {
    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an Assistant for Tanishk's portfolio.",
        },
        {
          role: "system",
          content: `Portfolio Data: ${portfolioData}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log(chatCompletion.data);
    res.json({ response: chatCompletion.data.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "OpenAI API error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
