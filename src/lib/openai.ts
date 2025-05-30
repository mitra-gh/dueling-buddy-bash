import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export const getOpenAIInstance = () => {
  if (!openaiInstance) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found. Commentary features will be disabled.');
      return null;
    }
    
    try {
      openaiInstance = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      return null;
    }
  }
  return openaiInstance;
};

export const generateGameCommentary = async (prompt: string): Promise<string> => {
  const openai = getOpenAIInstance();
  if (!openai) {
    return "Commentary unavailable";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an enthusiastic and witty sports commentator for board games."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    });

    return response.choices[0]?.message?.content || "The game continues...";
  } catch (error) {
    console.error('Failed to generate commentary:', error);
    return "The game continues...";
  }
}; 