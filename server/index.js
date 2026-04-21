import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.post("/generate", async (req, res) => {
  try {
    let { content, pdfBase64 } = req.body;

    if (pdfBase64) {
      try {
        const cleanBase64 = pdfBase64.includes(",")
          ? pdfBase64.split(",")[1]
          : pdfBase64;

        const buffer = Buffer.from(cleanBase64, "base64");
        const pdfData = await pdfParse(buffer);
        content = pdfData.text || "";
      } catch (err) {
        console.error("PDF Error:", err.message);
        return res.status(400).json({ error: "Failed to read PDF" });
      }
    }

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: "No content provided" });
    }

    // Truncate for token limit
    const maxChars = 12000;
    if (content.length > maxChars) {
      content = content.substring(0, maxChars);
    }

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Create study materials from this content. Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary",
  "flashcards": [{"front": "question", "back": "answer"}],
  "quiz": [{"question": "question?", "options": ["a", "b", "c", "d"], "correct": 0}]
}

Make 6 flashcards and 5 quiz questions from this:
${content}`,
        },
      ],
    });

    const text = completion.choices[0].message.content;
    const json = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(json);

    res.json(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to process" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});