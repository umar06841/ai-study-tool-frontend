import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createRequire } from "module";
import axios from "axios";
import crypto from "crypto";

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

// Razorpay API
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// Generate study materials
app.post("/generate", async (req, res) => {
  try {
    const { content, pdfBase64, userId, tier } = req.body;

    // Check free tier limit
    if (tier === "free") {
      // In production, check Firebase for actual usage
      // For now, allow 5 per day
    }

    let text = content;
    if (pdfBase64) {
      try {
        const cleanBase64 = pdfBase64.includes(",")
          ? pdfBase64.split(",")[1]
          : pdfBase64;
        const buffer = Buffer.from(cleanBase64, "base64");
        const pdfData = await pdfParse(buffer);
        text = pdfData.text || "";
      } catch (err) {
        return res.status(400).json({ error: "Failed to read PDF" });
      }
    }

    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: "No content provided" });
    }

    const maxChars = 12000;
    if (text.length > maxChars) {
      text = text.substring(0, maxChars);
    }

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Create study materials. Return ONLY JSON:
{
  "summary": "2-3 sentence summary",
  "flashcards": [{"front": "question", "back": "answer"}],
  "quiz": [{"question": "q?", "options": ["a","b","c","d"], "correct": 0}]
}

Content: ${text}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    const result = JSON.parse(raw);

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process" });
  }
});

// Create subscription order with Razorpay
app.post("/create-subscription", async (req, res) => {
  try {
    const { email, amount, currency, userId } = req.body;

    // Create order on Razorpay
    const options = {
      amount: amount * 100, // Convert to paise/cents
      currency: currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      description: "LearnOva Pro Subscription",
      customer_notify: 1,
    };

    const auth = Buffer.from(
      `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      options,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      orderId: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify payment
app.post("/verify-payment", async (req, res) => {
  try {
    const { orderId, paymentId, signature, userId } = req.body;

    // Verify signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Payment verified - update user in Firebase (from your frontend)
    res.json({ success: true, message: "Payment verified" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Get user subscription status
app.get("/user-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // In production, fetch from Firebase
    // For now, return default
    res.json({
      tier: "free",
      usesThisDay: 0,
      dailyLimit: 5,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user status" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server on port ${PORT}`);
});
