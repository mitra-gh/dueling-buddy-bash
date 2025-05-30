import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// OpenAI endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    console.log("Received chat request with body:", req.body);
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid request - messages array is required");
      return res.status(400).json({ error: "Messages array is required" });
    }

    console.log("Calling OpenAI API...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log("Received response from OpenAI");
    return res.json(completion);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    openaiConfigured: !!openai
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log("OpenAI configured:", !!openai);
});
