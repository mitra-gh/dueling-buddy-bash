
import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';

interface ButtonMasherProps {
  onGameEnd: (winner: 1 | 2) => void;
}

const ButtonMasher: React.FC<ButtonMasherProps> = ({ onGameEnd }) => {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [player1Animation, setPlayer1Animation] = useState(false);
  const [player2Animation, setPlayer2Animation] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!gameStarted || winner || timeLeft <= 0) return;
    
    if (event.code === 'Space') {
      event.preventDefault();
      setPlayer1Score(prev => prev + 1);
      setPlayer1Animation(true);
      setTimeout(() => setPlayer1Animation(false), 150);
    } else if (event.code === 'Enter') {
      event.preventDefault();
      setPlayer2Score(prev => prev + 1);
      setPlayer2Animation(true);
      setTimeout(() => setPlayer2Animation(false), 150);
    }
  }, [gameStarted, winner, timeLeft]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (countdown > 0) {
        setCountdown(prev => prev - 1);
      } else if (countdown === 0 && !gameStarted) {
        setGameStarted(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game over
          const gameWinner = player1Score > player2Score ? 1 : player2Score > player1Score ? 2 : null;
          if (gameWinner) {
            setWinner(gameWinner);
            onGameEnd(gameWinner);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, player1Score, player2Score, onGameEnd]);

  const getPlayerBarHeight = (score: number) => {
    const maxScore = Math.max(player1Score, player2Score, 1);
    return Math.min((score / maxScore) * 100, 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
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
            <div className="text-2xl text-white mb-2">
              Final Score: {player1Score} - {player2Score}
            </div>
            <div className="text-lg text-white/80">Returning to menu...</div>
          </div>
        </div>
      )}

      {/* Game over with tie */}
      {timeLeft === 0 && !winner && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="text-center">
            <div className="text-6xl font-bold text-orange-400 mb-4 animate-pulse">
              IT'S A TIE!
            </div>
            <div className="text-2xl text-white mb-2">
              Final Score: {player1Score} - {player2Score}
            </div>
            <div className="text-lg text-white/80">Returning to menu...</div>
          </div>
        </div>
      )}

      {/* Game Title */}
      <h1 className="text-4xl font-bold text-white mb-4 text-center">
        ⚡ BUTTON MASHER ⚡
      </h1>

      {/* Timer */}
      {gameStarted && (
        <div className="text-6xl font-bold text-yellow-400 mb-8 animate-pulse">
          {timeLeft}s
        </div>
      )}

      {/* Score Display */}
      <div className="flex items-end justify-center gap-8 mb-12 h-64">
        {/* Player 1 */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-blue-400 mb-4">Player 1</div>
          <div className="relative w-24 h-48 bg-gray-800 rounded-full border-4 border-blue-500 overflow-hidden">
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-300 ${player1Animation ? 'animate-pulse' : ''}`}
              style={{ height: `${getPlayerBarHeight(player1Score)}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className={`w-8 h-8 text-white ${player1Animation ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-4">{player1Score}</div>
          <div className={`mt-2 px-4 py-2 rounded-full text-white font-bold ${player1Animation ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}>
            SPACE
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center h-48">
          <div className="text-4xl font-bold text-white animate-pulse">VS</div>
        </div>

        {/* Player 2 */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-green-400 mb-4">Player 2</div>
          <div className="relative w-24 h-48 bg-gray-800 rounded-full border-4 border-green-500 overflow-hidden">
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-emerald-400 transition-all duration-300 ${player2Animation ? 'animate-pulse' : ''}`}
              style={{ height: `${getPlayerBarHeight(player2Score)}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className={`w-8 h-8 text-white ${player2Animation ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-4">{player2Score}</div>
          <div className={`mt-2 px-4 py-2 rounded-full text-white font-bold ${player2Animation ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}>
            ENTER
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-white/80">
        <p className="text-lg">Press your button as fast as you can!</p>
        <p className="text-sm">Player 1: SPACEBAR • Player 2: ENTER</p>
      </div>

      {/* Background animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-500 rounded-full opacity-10 animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-cyan-500 rounded-full opacity-10 animate-bounce"></div>
        <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-yellow-500 rounded-full opacity-10 animate-pulse"></div>
      </div>
    </div>
  );
};

export default ButtonMasher;
