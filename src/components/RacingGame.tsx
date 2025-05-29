import React, { useState, useEffect, useCallback } from "react";
import { Car } from "lucide-react";
import GameCommentary from "./GameCommentary";

interface RacingGameProps {
  onGameEnd: (winner: 1 | 2) => void;
}

const RacingGame: React.FC<RacingGameProps> = ({ onGameEnd }) => {
  const [player1Position, setPlayer1Position] = useState(0);
  const [player2Position, setPlayer2Position] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [keysPressed, setKeysPressed] = useState(new Set<string>());

  const FINISH_LINE = 800;
  const BOOST_AMOUNT = 15;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!gameStarted || winner) return;

      const key = event.key.toLowerCase();
      if (keysPressed.has(key)) return;

      setKeysPressed((prev) => new Set(prev).add(key));

      if (key === "a") {
        setPlayer1Position((prev) =>
          Math.min(prev + BOOST_AMOUNT, FINISH_LINE)
        );
      } else if (key === "d") {
        setPlayer1Position((prev) =>
          Math.min(prev + BOOST_AMOUNT, FINISH_LINE)
        );
      } else if (key === "arrowleft") {
        setPlayer2Position((prev) =>
          Math.min(prev + BOOST_AMOUNT, FINISH_LINE)
        );
      } else if (key === "arrowright") {
        setPlayer2Position((prev) =>
          Math.min(prev + BOOST_AMOUNT, FINISH_LINE)
        );
      }
    },
    [gameStarted, winner, keysPressed]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setKeysPressed((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (countdown > 0) {
        setCountdown((prev) => prev - 1);
      } else if (countdown === 0 && !gameStarted) {
        setGameStarted(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, gameStarted]);

  useEffect(() => {
    if (player1Position >= FINISH_LINE && !winner) {
      setWinner(1);
      onGameEnd(1);
    } else if (player2Position >= FINISH_LINE && !winner) {
      setWinner(2);
      onGameEnd(2);
    }
  }, [player1Position, player2Position, winner, onGameEnd]);

  const player1Progress = (player1Position / FINISH_LINE) * 100;
  const player2Progress = (player2Position / FINISH_LINE) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900">
      {/* Game Commentary */}
      <GameCommentary
        player1Position={player1Position}
        player2Position={player2Position}
        gameStarted={gameStarted}
        winner={winner}
      />

      {/* Countdown */}
      {countdown > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="text-9xl font-bold text-white animate-bounce">
            {countdown}
          </div>
        </div>
      )}

      {/* Winner announcement */}
      {winner && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="text-center">
            <div className="text-6xl font-bold text-yellow-400 mb-4 animate-pulse">
              PLAYER {winner} WINS!
            </div>
            <div className="text-2xl text-white">Returning to menu...</div>
          </div>
        </div>
      )}

      {/* Game Title */}
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        🏁 RACING CHALLENGE 🏁
      </h1>

      {/* Race Track */}
      <div className="w-full max-w-6xl mx-auto">
        {/* Player 1 Track */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-blue-400">Player 1</span>
            <span className="text-lg text-white">
              {Math.round(player1Progress)}%
            </span>
          </div>
          <div className="relative h-16 bg-gray-800 rounded-full border-4 border-blue-500 shadow-lg overflow-hidden">
            {/* Track decorations */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/30 transform -translate-y-1/2"></div>

            {/* Car */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-100 ease-out"
              style={{ left: `${player1Progress}%` }}
            >
              <div className="relative">
                <Car className="w-12 h-8 text-blue-400 drop-shadow-lg" />
                {keysPressed.has("a") || keysPressed.has("d") ? (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-1 bg-orange-500 rounded animate-pulse"></div>
                    <div className="w-3 h-1 bg-red-500 rounded animate-pulse mt-1"></div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Finish line */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-400 to-red-500"></div>
          </div>
          <div className="text-center text-blue-300 mt-2">
            Press A or D to boost!
          </div>
        </div>

        {/* Player 2 Track */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-green-400">Player 2</span>
            <span className="text-lg text-white">
              {Math.round(player2Progress)}%
            </span>
          </div>
          <div className="relative h-16 bg-gray-800 rounded-full border-4 border-green-500 shadow-lg overflow-hidden">
            {/* Track decorations */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-cyan-500/20"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/30 transform -translate-y-1/2"></div>

            {/* Car */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-100 ease-out"
              style={{ left: `${player2Progress}%` }}
            >
              <div className="relative">
                <Car className="w-12 h-8 text-green-400 drop-shadow-lg" />
                {keysPressed.has("arrowleft") ||
                keysPressed.has("arrowright") ? (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-1 bg-orange-500 rounded animate-pulse"></div>
                    <div className="w-3 h-1 bg-red-500 rounded animate-pulse mt-1"></div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Finish line */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-400 to-red-500"></div>
          </div>
          <div className="text-center text-green-300 mt-2">
            Press ← or → to boost!
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-white/80 mt-8">
        <p className="text-lg">Race to the finish line!</p>
        <p className="text-sm">
          Alternate between your keys for maximum speed!
        </p>
      </div>
    </div>
  );
};

export default RacingGame;
