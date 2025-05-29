
import React from 'react';
import { Car, User, RotateCcw } from 'lucide-react';

interface GameMenuProps {
  onGameSelect: (game: 'racing' | 'platformjump') => void;
  player1Score: number;
  player2Score: number;
  onResetScores: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ 
  onGameSelect, 
  player1Score, 
  player2Score, 
  onResetScores 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-pink-500 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/4 right-8 w-24 h-24 bg-cyan-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-8 w-20 h-20 bg-yellow-500 rounded-full opacity-20 animate-ping"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
          PARTY
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 animate-fade-in">
          Two Player Games
        </h2>

        {/* Score Display */}
        <div className="flex justify-center items-center gap-8 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl shadow-2xl border-2 border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">Player 1</h3>
            <div className="text-4xl font-bold text-yellow-300">{player1Score}</div>
          </div>
          
          <button
            onClick={onResetScores}
            className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-full shadow-lg hover:scale-110 transform transition-all duration-200 border-2 border-white/20"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>

          <div className="bg-gradient-to-br from-green-500 to-teal-600 p-6 rounded-2xl shadow-2xl border-2 border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">Player 2</h3>
            <div className="text-4xl font-bold text-yellow-300">{player2Score}</div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Racing Game */}
          <button
            onClick={() => onGameSelect('racing')}
            className="group relative bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-3xl shadow-2xl border-4 border-white/20 hover:border-white/40 transform hover:scale-105 transition-all duration-300 hover:shadow-orange-500/25"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-3xl blur group-hover:blur-sm transition-all"></div>
            <div className="relative z-10">
              <Car className="w-16 h-16 text-white mx-auto mb-4 group-hover:animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">RACING</h3>
              <p className="text-white/80">Race to the finish line!</p>
              <div className="mt-4 text-sm text-white/60">
                Player 1: A/D • Player 2: ←/→
              </div>
            </div>
          </button>

          {/* Platform Jump */}
          <button
            onClick={() => onGameSelect('platformjump')}
            className="group relative bg-gradient-to-br from-cyan-500 to-blue-600 p-8 rounded-3xl shadow-2xl border-4 border-white/20 hover:border-white/40 transform hover:scale-105 transition-all duration-300 hover:shadow-cyan-500/25"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-3xl blur group-hover:blur-sm transition-all"></div>
            <div className="relative z-10">
              <User className="w-16 h-16 text-white mx-auto mb-4 group-hover:animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">PLATFORM JUMP</h3>
              <p className="text-white/80">Jump to reach the goal!</p>
              <div className="mt-4 text-sm text-white/60">
                Player 1: A/D/W • Player 2: ←/→/↑
              </div>
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-white/60 text-center max-w-2xl mx-auto">
          <p className="text-lg">Choose a game and compete against your friend!</p>
          <p className="text-sm mt-2">First to win 5 rounds is the champion!</p>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
