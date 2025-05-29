import express from "express";
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

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "Error: OPENAI_API_KEY is not set in the environment variables"
  );
  console.error(
    "Please create a .env file in the root directory with your OpenAI API key:"
  );
  console.error("OPENAI_API_KEY=your-api-key-here");
  process.exit(1);
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  //baseURL: "https://api.metisai.ir/openai/v1",
});

// OpenAI endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    res.json(completion.choices[0].message);
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);

    // Provide more specific error messages
    if (error.response?.status === 401) {
      return res.status(401).json({
        error:
          "Invalid API key. Please check your OpenAI API key in the .env file.",
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
      });
    }

    res.status(500).json({
      error: "Error processing your request",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`);
});
