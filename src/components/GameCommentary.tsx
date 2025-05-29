import React, { useState, useEffect } from "react";

interface GameCommentaryProps {
  player1Position: number;
  player2Position: number;
  gameStarted: boolean;
  winner: 1 | 2 | null;
}

const GameCommentary: React.FC<GameCommentaryProps> = ({
  player1Position,
  player2Position,
  gameStarted,
  winner,
}) => {
  const [commentary, setCommentary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameStarted || winner) return;

    const fetchCommentary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("http://localhost:3001/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are an exciting racing commentator. Provide short, energetic commentary about the race. Keep responses under 100 characters.",
              },
              {
                role: "user",
                content: `Player 1 is at ${Math.round(
                  (player1Position / 800) * 100
                )}% and Player 2 is at ${Math.round(
                  (player2Position / 800) * 100
                )}% of the track. Give an exciting commentary!`,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch commentary");
        }

        const data = await response.json();
        setCommentary(data.content);
      } catch (error: any) {
        console.error("Error fetching commentary:", error);
        setError(error.message || "Failed to fetch commentary");
        setCommentary(""); // Clear any existing commentary
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API calls to avoid too many requests
    const timeoutId = setTimeout(fetchCommentary, 500);
    return () => clearTimeout(timeoutId);
  }, [player1Position, player2Position, gameStarted, winner]);

  if (!gameStarted || winner) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/70 text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <p className="text-lg font-bold animate-pulse">{commentary}</p>
        )}
      </div>
    </div>
  );
};

export default GameCommentary;
