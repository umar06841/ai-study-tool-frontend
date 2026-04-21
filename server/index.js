import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createRequire } from "module";

dotenv.config();

// =========================
// PDF FIX (STABLE VERSION)
// =========================
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// =========================
// GROQ CLIENT
// =========================
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.json({ status: "OK 🚀 Server running" });
});

// =========================
// MAIN API
// =========================
app.post("/generate", async (req, res) => {
  try {
    let { content, pdfBase64 } = req.body;

    // =========================
    // PDF HANDLING (FIXED + SAFE)
    // =========================
    if (pdfBase64) {
      try {
        const cleanBase64 = pdfBase64.includes(",")
          ? pdfBase64.split(",")[1]
          : pdfBase64;

        const buffer = Buffer.from(cleanBase64, "base64");

        const pdfData = await pdfParse(buffer);

        if (!pdfData?.text) {
          return res.status(400).json({
            error: "PDF has no readable text",
          });
        }

        content = pdfData.text;
      } catch (err) {
        console.error("📄 PDF ERROR:", err);
        return res.status(400).json({
          error: "Failed to read PDF file (invalid or corrupted)",
        });
      }
    }

    // =========================
    // VALIDATION
    // =========================
    if (!content || content.trim().length < 5) {
      return res.status(400).json({
        error: "No valid content provided",
      });
    }

    // =========================
    // AI CALL (GROQ)
    // =========================
    let completion;

    try {
      completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `
Return ONLY valid JSON. No markdown, no explanation.

{
  "summary": "3-5 sentence summary",
  "flashcards": [
    { "front": "Question", "back": "Answer" }
  ],
  "quiz": [
    {
      "question": "Question?",
      "options": ["A", "B", "C", "D"],
      "correct": 0
    }
  ]
}

Rules:
- 6 flashcards
- 5 quiz questions
- strict JSON only
            `,
          },
          { role: "user", content },
        ],
      });
    } catch (err) {
      console.error("🤖 AI ERROR:", err);
      return res.status(500).json({
        error: "AI request failed",
      });
    }

    // =========================
    // CLEAN RESPONSE
    // =========================
    let raw = completion?.choices?.[0]?.message?.content || "";

    raw = raw.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", raw);

      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error("💥 SERVER ERROR:", err);

    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});