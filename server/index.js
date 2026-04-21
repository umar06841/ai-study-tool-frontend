import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.get("/", (req, res) => {
  res.json({ status: "OK 🚀 Server running" });
});

app.post("/generate", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: "No content provided" });
    }

    // Truncate if too long
    const text = content.length > 10000 
      ? content.substring(0, 10000) 
      : content;

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `Return ONLY valid JSON:
{
  "summary": "brief summary",
  "flashcards": [{"front": "Q?", "back": "A"}],
  "quiz": [{"question": "Q?", "options": ["A", "B", "C", "D"], "correct": 0}]
}`,
        },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(raw);
    res.json(parsed);

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));