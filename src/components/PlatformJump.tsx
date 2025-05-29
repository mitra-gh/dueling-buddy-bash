import React, { useState, useEffect, useCallback } from 'react';
import { Flag } from 'lucide-react';

interface PlatformJumpProps {
  onGameEnd: (winner: 1 | 2) => void;
}

const PlatformJump: React.FC<PlatformJumpProps> = ({ onGameEnd }) => {
  const [player1Position, setPlayer1Position] = useState({ x: 50, y: 400 });
  const [player2Position, setPlayer2Position] = useState({ x: 50, y: 450 });
  const [player1Velocity, setPlayer1Velocity] = useState({ x: 0, y: 0 });
  const [player2Velocity, setPlayer2Velocity] = useState({ x: 0, y: 0 });
  const [player1OnGround, setPlayer1OnGround] = useState(true);
  const [player2OnGround, setPlayer2OnGround] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [keysPressed, setKeysPressed] = useState(new Set<string>());

  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const MOVE_SPEED = 5;
  const GROUND_Y = 500;

  // Redesigned platform layout for more varied and challenging gameplay
  const platforms = [
    { x: 150, y: 450, width: 80, height: 15 },
    { x: 280, y: 380, width: 70, height: 15 },
    { x: 400, y: 320, width: 90, height: 15 },
    { x: 250, y: 250, width: 80, height: 15 },
    { x: 450, y: 200, width: 70, height: 15 },
    { x: 600, y: 280, width: 85, height: 15 },
    { x: 750, y: 220, width: 75, height: 15 },
    { x: 580, y: 150, width: 80, height: 15 },
    { x: 850, y: 160, width: 70, height: 15 },
    { x: 980, y: 120, width: 120, height: 15 }, // Goal platform
  ];

  // Goal platform is the last one
  const goalPlatform = platforms[platforms.length - 1];

  const checkCollision = (playerPos: { x: number; y: number }, velocity: { x: number; y: number }) => {
    const playerBottom = playerPos.y + 30;
    const playerLeft = playerPos.x;
    const playerRight = playerPos.x + 30;
    
    // Check ground collision
    if (playerBottom >= GROUND_Y && velocity.y >= 0) {
      return { collision: true, y: GROUND_Y - 30 };
    }
    
    // Check platform collisions
    for (const platform of platforms) {
      if (
        playerRight > platform.x &&
        playerLeft < platform.x + platform.width &&
        playerBottom >= platform.y &&
        playerBottom <= platform.y + platform.height + 10 &&
        velocity.y >= 0
      ) {
        return { collision: true, y: platform.y - 30 };
      }
    }
    
    return { collision: false, y: playerPos.y };
  };

  const isOnGoalPlatform = (playerPos: { x: number; y: number }) => {
    const playerBottom = playerPos.y + 30;
    const playerLeft = playerPos.x;
    const playerRight = playerPos.x + 30;
    
    return (
      playerRight > goalPlatform.x &&
      playerLeft < goalPlatform.x + goalPlatform.width &&
      playerBottom >= goalPlatform.y &&
      playerBottom <= goalPlatform.y + goalPlatform.height + 5
    );
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!gameStarted || winner) return;
    
    const key = event.key.toLowerCase();
    if (keysPressed.has(key)) return;
    
    setKeysPressed(prev => new Set(prev).add(key));
    
    // Player 1 controls (A/D for move, W for jump)
    if (key === 'w' && player1OnGround) {
      setPlayer1Velocity(prev => ({ ...prev, y: JUMP_FORCE }));
      setPlayer1OnGround(false);
    }
    
    // Player 2 controls (Arrow keys)
    if (key === 'arrowup' && player2OnGround) {
      setPlayer2Velocity(prev => ({ ...prev, y: JUMP_FORCE }));
      setPlayer2OnGround(false);
    }
  }, [gameStarted, winner, player1OnGround, player2OnGround, keysPressed]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setKeysPressed(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Game physics update
  useEffect(() => {
    if (!gameStarted || winner) return;

    const gameLoop = setInterval(() => {
      // Update Player 1
      setPlayer1Position(prev => {
        let newVelX = 0;
        if (keysPressed.has('a')) newVelX = -MOVE_SPEED;
        if (keysPressed.has('d')) newVelX = MOVE_SPEED;
        
        setPlayer1Velocity(currentVel => {
          const newVelY = currentVel.y + GRAVITY;
          const newPos = { x: prev.x + newVelX, y: prev.y + newVelY };
          
          // Keep player in bounds
          newPos.x = Math.max(0, Math.min(1170, newPos.x));
          
          const collision = checkCollision(newPos, { x: newVelX, y: newVelY });
          if (collision.collision) {
            setPlayer1OnGround(true);
            return { x: newVelX, y: 0 };
          } else {
            setPlayer1OnGround(false);
            return { x: newVelX, y: newVelY };
          }
        });
        
        const collision = checkCollision({ x: prev.x + newVelX, y: prev.y + player1Velocity.y }, { x: newVelX, y: player1Velocity.y });
        return { x: prev.x + newVelX, y: collision.collision ? collision.y : prev.y + player1Velocity.y };
      });

      // Update Player 2
      setPlayer2Position(prev => {
        let newVelX = 0;
        if (keysPressed.has('arrowleft')) newVelX = -MOVE_SPEED;
        if (keysPressed.has('arrowright')) newVelX = MOVE_SPEED;
        
        setPlayer2Velocity(currentVel => {
          const newVelY = currentVel.y + GRAVITY;
          const newPos = { x: prev.x + newVelX, y: prev.y + newVelY };
          
          // Keep player in bounds
          newPos.x = Math.max(0, Math.min(1170, newPos.x));
          
          const collision = checkCollision(newPos, { x: newVelX, y: newVelY });
          if (collision.collision) {
            setPlayer2OnGround(true);
            return { x: newVelX, y: 0 };
          } else {
            setPlayer2OnGround(false);
            return { x: newVelX, y: newVelY };
          }
        });
        
        const collision = checkCollision({ x: prev.x + newVelX, y: prev.y + player2Velocity.y }, { x: newVelX, y: player2Velocity.y });
        return { x: prev.x + newVelX, y: collision.collision ? collision.y : prev.y + player2Velocity.y };
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameStarted, winner, keysPressed, player1Velocity.y, player2Velocity.y]);

  // Countdown timer
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

  // Check for winner - must be ON the goal platform
  useEffect(() => {
    if (isOnGoalPlatform(player1Position) && !winner) {
      setWinner(1);
      onGameEnd(1);
    } else if (isOnGoalPlatform(player2Position) && !winner) {
      setWinner(2);
      onGameEnd(2);
    }
  }, [player1Position, player2Position, winner, onGameEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 overflow-hidden relative">
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
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-4xl font-bold text-white text-center">
          🏃‍♂️ PLATFORM JUMP RACE 🏃‍♂️
        </h1>
      </div>

      {/* Game World */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Ground */}
        <div 
          className="absolute bg-green-600 w-full h-20"
          style={{ top: GROUND_Y, left: 0 }}
        ></div>

        {/* Platforms */}
        {platforms.map((platform, index) => (
          <div
            key={index}
            className={`absolute rounded-lg ${index === platforms.length - 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-2 border-yellow-300 shadow-lg shadow-yellow-400/50' : 'bg-gradient-to-r from-gray-600 to-gray-800 border-2 border-gray-500'}`}
            style={{
              left: platform.x,
              top: platform.y,
              width: platform.width,
              height: platform.height,
            }}
          >
            {index === platforms.length - 1 && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <Flag className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            )}
          </div>
        ))}

        {/* Player 1 - Blue Ninja */}
        <div
          className="absolute transition-all duration-75 ease-linear text-3xl"
          style={{
            left: player1Position.x,
            top: player1Position.y,
            width: 30,
            height: 30,
          }}
        >
          🥷
        </div>

        {/* Player 2 - Red Ninja */}
        <div
          className="absolute transition-all duration-75 ease-linear text-3xl"
          style={{
            left: player2Position.x,
            top: player2Position.y,
            width: 30,
            height: 30,
          }}
        >
          🧑‍🦲
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex gap-8 text-white text-center">
          <div className="bg-blue-900/80 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-blue-400 mb-2">Player 1 🥷</h3>
            <p className="text-sm">A/D: Move • W: Jump</p>
          </div>
          <div className="bg-red-900/80 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-red-400 mb-2">Player 2 🧑‍🦲</h3>
            <p className="text-sm">←/→: Move • ↑: Jump</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformJump;
