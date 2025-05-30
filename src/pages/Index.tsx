import React, { useState } from 'react';
import GameMenu from '../components/GameMenu';
import RacingGame from '../components/RacingGame';
import PlatformJump from '../components/PlatformJump';
import LudoGame from '../components/LudoGame';

type GameState = 'menu' | 'racing' | 'platformjump' | 'ludo';

const Index = () => {
  const [currentGame, setCurrentGame] = useState<GameState>('menu');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);

  const handleGameSelect = (game: GameState) => {
    setCurrentGame(game);
  };

  const handleGameEnd = (winner: 1 | 2) => {
    if (winner === 1) {
      setPlayer1Score(prev => prev + 1);
    } else {
      setPlayer2Score(prev => prev + 1);
    }
    
    setTimeout(() => {
      setCurrentGame('menu');
    }, 3000);
  };

  const resetScores = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {currentGame === 'menu' && (
        <GameMenu 
          onGameSelect={handleGameSelect}
          player1Score={player1Score}
          player2Score={player2Score}
          onResetScores={resetScores}
        />
      )}
      {currentGame === 'racing' && (
        <RacingGame onGameEnd={handleGameEnd} />
      )}
      {currentGame === 'platformjump' && (
        <PlatformJump onGameEnd={handleGameEnd} />
      )}
      {currentGame === 'ludo' && (
        <LudoGame onGameEnd={() => setCurrentGame('menu')} />
      )}
    </div>
  );
};

export default Index;
