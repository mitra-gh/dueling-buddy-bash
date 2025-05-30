import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { generateGameCommentary } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

interface LudoGameProps {
  onGameEnd: () => void;
}

interface Pawn {
  id: number;
  player: 1 | 2 | 3 | 4;
  position: number; // 0 = home, 1-52 = board positions, 53-58 = finish area
  isInHome: boolean;
  isFinished: boolean;
}

interface GameEvent {
  type: 'MOVE' | 'NO_MOVES' | 'CAPTURE' | 'HOME' | 'FINISH';
  player: number;
  diceRoll?: number;
  pawnId?: number;
  fromPosition?: number;
  toPosition?: number;
  capturedPawn?: Pawn;
}

const COLORS = {
  1: "red",
  2: "green",
  3: "yellow",
  4: "blue",
};

const BOARD_SIZE = 15;
const COMMENTARY_DELAY = 2000; // 2 seconds

const LudoGame: React.FC<LudoGameProps> = ({ onGameEnd }) => {
  const { toast } = useToast();
  const commentaryQueue = useRef<{ event: GameEvent; timestamp: number }[]>([]);
  const [isProcessingCommentary, setIsProcessingCommentary] = useState(false);
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPawn, setSelectedPawn] = useState<number | null>(null);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 3 | 4 | null>(null);
  const [movablePawns, setMovablePawns] = useState<number[]>([]);
  const [lastCommentaryTime, setLastCommentaryTime] = useState<number>(0);

  // Initialize pawns
  useEffect(() => {
    const initialPawns: Pawn[] = [];
    for (let player = 1; player <= 4; player++) {
      for (let i = 0; i < 4; i++) {
        initialPawns.push({
          id: (player - 1) * 4 + i,
          player: player as 1 | 2 | 3 | 4,
          position: 0,
          isInHome: true,
          isFinished: false
        });
      }
    }
    setPawns(initialPawns);
  }, []);

  const getBoardPosition = (position: number) => {
    // Convert linear position to x,y coordinates on 15x15 grid
    // Position 1-52 represents the main track in clockwise order
    const positions = [
      // Starting from (0,6) moving right
      { x: 0, y: 6 },  // Red start
      { x: 1, y: 6 },
      { x: 2, y: 6 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },

      // Going up column 6
      { x: 6, y: 5 },
      { x: 6, y: 4 },
      { x: 6, y: 3 },
      { x: 6, y: 2 },
      { x: 6, y: 1 },
      { x: 6, y: 0 },

      // Moving right at top row
      { x: 7, y: 0 },
      { x: 8, y: 0 },  // Green start

      // Going down column 8
      { x: 8, y: 1 },
      { x: 8, y: 2 },
      { x: 8, y: 3 },
      { x: 8, y: 4 },
      { x: 8, y: 5 },
      { x: 8, y: 6 },

      // Moving right along row 6
      { x: 9, y: 6 },
      { x: 10, y: 6 },
      { x: 11, y: 6 },
      { x: 12, y: 6 },
      { x: 13, y: 6 },
      { x: 14, y: 6 },
      { x: 15, y: 6 },

      // Going down rightmost column
      { x: 15, y: 7 },
      { x: 15, y: 8 },

      // Moving left along row 8
      { x: 14, y: 8 },
      { x: 13, y: 8 },
      { x: 12, y: 8 },
      { x: 11, y: 8 },
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 },

      // Going down column 8
      { x: 8, y: 9 },
      { x: 8, y: 10 },
      { x: 8, y: 11 },
      { x: 8, y: 12 },
      { x: 8, y: 13 },
      { x: 8, y: 14 },
      { x: 8, y: 15 },  // Blue start

      // Moving left at bottom row
      { x: 7, y: 15 },
      { x: 6, y: 15 },  // Yellow start

      // Going up column 6
      { x: 6, y: 14 },
      { x: 6, y: 13 },
      { x: 6, y: 12 },
      { x: 6, y: 11 },
      { x: 6, y: 10 },
      { x: 6, y: 9 },
      { x: 6, y: 8 },

      // Moving left along row 8
      { x: 5, y: 8 },
      { x: 4, y: 8 },
      { x: 3, y: 8 },
      { x: 2, y: 8 },
      { x: 1, y: 8 },
      { x: 0, y: 8 },

      // Going up leftmost column
      { x: 0, y: 7 }
    ];
    
    return positions[position - 1] || { x: 7, y: 7 };
  };

  const getStartPosition = (player: number) => {
    // Starting positions for each player with exact coordinates:
    // Red: (0,6)
    // Green: (8,0)
    // Blue: (8,15)
    // Yellow: (6,15)
    const startPositions = {
      1: 1,     // Red starts at (0,6)
      2: 15,    // Green starts at (8,0)
      3: 45,    // Yellow starts at (6,15)
      4: 39     // Blue starts at (8,15)
    };
    return startPositions[player as keyof typeof startPositions];
  };

  const getHomePosition = (player: number, pawnIndex: number) => {
    const homePositions = {
      1: [ // Red (top left)
        { x: 2, y: 2 }, { x: 3, y: 2 }, 
        { x: 2, y: 3 }, { x: 3, y: 3 }
      ],
      2: [ // Green (top right)
        { x: 11, y: 2 }, { x: 12, y: 2 }, 
        { x: 11, y: 3 }, { x: 12, y: 3 }
      ],
      3: [ // Yellow (bottom left)
        { x: 2, y: 11 }, { x: 3, y: 11 }, 
        { x: 2, y: 12 }, { x: 3, y: 12 }
      ],
      4: [ // Blue (bottom right)
        { x: 11, y: 11 }, { x: 12, y: 11 }, 
        { x: 11, y: 12 }, { x: 12, y: 12 }
      ]
    };
    return homePositions[player as keyof typeof homePositions][pawnIndex];
  };

  const getFinalPosition = (player: number, steps: number) => {
    // Final paths for each player (6 steps)
    const finalPaths = {
      1: [ // Red final path (moving right from left side)
        { x: 1, y: 7 },
        { x: 2, y: 7 },
        { x: 3, y: 7 },
        { x: 4, y: 7 },
        { x: 5, y: 7 },
        { x: 6, y: 7 }
      ],
      2: [ // Green final path (moving down from top)
        { x: 7, y: 1 },
        { x: 7, y: 2 },
        { x: 7, y: 3 },
        { x: 7, y: 4 },
        { x: 7, y: 5 },
        { x: 7, y: 6 }
      ],
      3: [ // Yellow final path (moving up from bottom)
        { x: 7, y: 14 },
        { x: 7, y: 13 },
        { x: 7, y: 12 },
        { x: 7, y: 11 },
        { x: 7, y: 10 },
        { x: 7, y: 9 }
      ],
      4: [ // Blue final path (moving left from right)
        { x: 14, y: 7 },
        { x: 13, y: 7 },
        { x: 12, y: 7 },
        { x: 11, y: 7 },
        { x: 10, y: 7 },
        { x: 9, y: 7 }
      ]
    };
    return finalPaths[player as keyof typeof finalPaths][steps - 1];
  };

  // Update movable pawns when dice is rolled
  useEffect(() => {
    if (diceValue && currentPlayer <= 2) { // Only for human players
      const currentPlayerPawns = pawns.filter(p => p.player === currentPlayer);
      const movable = currentPlayerPawns.filter(pawn => {
        if (pawn.isFinished) return false;
        if (pawn.isInHome) return diceValue === 6;
        return true;
      }).map(p => p.id);
      
      setMovablePawns(movable);
      
      if (movable.length === 1) {
        setSelectedPawn(movable[0]);
      }
    }
  }, [diceValue, pawns, currentPlayer]);

  const getGameStateDescription = () => {
    const playerStates = [1, 2, 3, 4].map(player => {
      const playerPawns = pawns.filter(p => p.player === player);
      return {
        player,
        color: COLORS[player as keyof typeof COLORS],
        isHuman: player <= 2,
        pawnsInHome: playerPawns.filter(p => p.isInHome).length,
        pawnsFinished: playerPawns.filter(p => p.isFinished).length,
        pawnsOnBoard: playerPawns.filter(p => !p.isInHome && !p.isFinished).length,
        pawnPositions: playerPawns.map(p => ({
          id: p.id,
          position: p.position,
          isInHome: p.isInHome,
          isFinished: p.isFinished
        }))
      };
    });

    return {
      currentPlayer,
      playerStates,
      lastDiceRoll: diceValue,
      winner
    };
  };

  const generateCommentary = async (event: GameEvent) => {
    // Check if enough time has passed since last commentary
    const now = Date.now();
    if (now - lastCommentaryTime < COMMENTARY_DELAY) {
      await new Promise(resolve => setTimeout(resolve, COMMENTARY_DELAY));
    }

    try {
      const gameState = getGameStateDescription();
      
      const prompt = `You are an enthusiastic and humorous sports commentator for a Ludo game. The game has 4 players (Red and Green are human, Yellow and Blue are AI).

Game Rules:
- Players roll a dice and move their pawns clockwise around the board
- A roll of 6 is needed to move a pawn out of home
- Landing on another player's pawn sends it back home
- Pawns must make a complete circuit before entering their home stretch
- First player to get all pawns home wins

Current Game State:
${JSON.stringify(gameState, null, 2)}

Event that just occurred:
${JSON.stringify(event, null, 2)}

Provide a brief, entertaining commentary (2-3 sentences max) about this event. Be creative, use puns, and make it exciting! Focus on the drama and strategy of the game.`;

      const commentary = await generateGameCommentary(prompt);
      
      toast({
        title: `🎲 ${COLORS[event.player as keyof typeof COLORS].toUpperCase()} Player's Move!`,
        description: commentary,
        duration: 4000,
      });

      setLastCommentaryTime(Date.now());
    } catch (error) {
      console.error("Error generating commentary:", error);
    }
  };

  const movePawn = () => {
    if (!selectedPawn || !diceValue) return;
    
    const selectedPawnData = pawns.find(p => p.id === selectedPawn);
    if (!selectedPawnData) return;

    const fromPosition = selectedPawnData.position;
    
    setPawns(prev => {
      const newPawns = prev.map(pawn => {
        if (pawn.id === selectedPawn) {
          let newPosition = pawn.position;
          let newIsInHome = pawn.isInHome;
          let newIsFinished = pawn.isFinished;
          
          if (pawn.isInHome && diceValue === 6) {
            newPosition = getStartPosition(pawn.player);
            newIsInHome = false;
            generateCommentary({
              type: 'HOME',
              player: currentPlayer,
              diceRoll: diceValue,
              pawnId: pawn.id
            });
          } else if (!pawn.isInHome && !pawn.isFinished) {
            newPosition = pawn.position + diceValue;
            
            if (newPosition > 52) {
              const adjustedPosition = newPosition - 52;
              if (adjustedPosition <= 6) {
                newPosition = adjustedPosition;
                if (adjustedPosition === 6) {
                  newIsFinished = true;
                  generateCommentary({
                    type: 'FINISH',
                    player: currentPlayer,
                    diceRoll: diceValue,
                    pawnId: pawn.id
                  });
                }
              } else {
                return pawn;
              }
            }

            const willCapture = prev.find(p => 
              p.player !== currentPlayer && 
              p.position === newPosition &&
              !p.isInHome && 
              !p.isFinished
            );

            if (willCapture) {
              generateCommentary({
                type: 'CAPTURE',
                player: currentPlayer,
                diceRoll: diceValue,
                pawnId: pawn.id,
                fromPosition,
                toPosition: newPosition,
                capturedPawn: willCapture
              });
            } else {
              generateCommentary({
                type: 'MOVE',
                player: currentPlayer,
                diceRoll: diceValue,
                pawnId: pawn.id,
                fromPosition,
                toPosition: newPosition
              });
            }
          }
          
          return {
            ...pawn,
            position: newPosition,
            isInHome: newIsInHome,
            isFinished: newIsFinished
          };
        }
        return pawn;
      });

      return newPawns;
    });

    if (diceValue !== 6) {
      setCurrentPlayer(currentPlayer === 4 ? 1 : (currentPlayer + 1) as 1 | 2 | 3 | 4);
    }
    
    setDiceValue(null);
    setSelectedPawn(null);
    setMovablePawns([]);
  };

  const rollDice = () => {
    if (isRolling || diceValue || currentPlayer > 2) return;
    
    setIsRolling(true);
    setSelectedPawn(null);
    
    // Check if all pawns are in home
    const currentPlayerPawns = pawns.filter(p => p.player === currentPlayer);
    const allPawnsInHome = currentPlayerPawns.every(p => p.isInHome);
    
    // Weighted roll: 50% chance of 6 if all pawns are home
    const getWeightedRoll = () => {
      if (allPawnsInHome) {
        return Math.random() < 0.5 ? 6 : Math.floor(Math.random() * 5) + 1;
      }
      return Math.floor(Math.random() * 6) + 1;
    };
    
    // Animate dice rolling
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        const finalRoll = getWeightedRoll();
        setDiceValue(finalRoll);
        setIsRolling(false);
      }
    }, 80);
  };

  const getDiceIcon = (value: number) => {
    const iconProps = { className: "w-8 h-8 text-white" };
    switch (value) {
      case 1: return <Dice1 {...iconProps} />;
      case 2: return <Dice2 {...iconProps} />;
      case 3: return <Dice3 {...iconProps} />;
      case 4: return <Dice4 {...iconProps} />;
      case 5: return <Dice5 {...iconProps} />;
      case 6: return <Dice6 {...iconProps} />;
      default: return <Dice1 {...iconProps} />;
    }
  };

  const renderBoard = () => {
    const board = [];
    
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        // Determine cell type and color
        let cellType = 'empty';
        let cellColor = 'bg-gray-800';
        
        // Home areas (corners)
        if ((x < 6 && y < 6) || (x > 8 && y < 6) || (x < 6 && y > 8) || (x > 8 && y > 8)) {
          if (x < 6 && y < 6) cellColor = 'bg-red-900/20';
          else if (x > 8 && y < 6) cellColor = 'bg-green-900/20';
          else if (x < 6 && y > 8) cellColor = 'bg-yellow-900/20';
          else cellColor = 'bg-blue-900/20';
        }
        // Path areas
        else if ((x === 7 && y >= 0) || (y === 7 && x >= 0)) {
          cellColor = 'bg-gray-700';
          
          // Color the paths to home
          if (x === 7 && y > 7) cellColor = 'bg-red-600/30';    // Red's path
          if (x > 7 && y === 7) cellColor = 'bg-green-600/30';  // Green's path
          if (x === 7 && y < 7) cellColor = 'bg-yellow-600/30'; // Yellow's path
          if (x < 7 && y === 7) cellColor = 'bg-blue-600/30';   // Blue's path
        }
        
        // Find pawns at this position
        const pawnsHere = pawns.filter(pawn => {
          if (pawn.isInHome) {
            const homePos = getHomePosition(pawn.player, pawn.id % 4);
            return homePos.x === x && homePos.y === y;
          }
          
          if (pawn.isFinished) {
            const finalPos = getFinalPosition(pawn.player, pawn.position - 52);
            return finalPos.x === x && finalPos.y === y;
          }
          
          const pos = getBoardPosition(pawn.position);
          return pos.x === x && pos.y === y;
        });
        
        board.push(
          <div
            key={`${x}-${y}`}
            className={cn(
              "w-8 h-8 border border-gray-700 flex items-center justify-center relative",
              cellColor
            )}
          >
            {pawnsHere.map((pawn, index) => (
              <div
                key={pawn.id}
                className={cn(
                  "w-6 h-6 rounded-full border-2 border-white cursor-pointer transform hover:scale-110 transition-transform",
                  `bg-${COLORS[pawn.player]}-500`,
                  selectedPawn === pawn.id && "ring-2 ring-white ring-offset-2 ring-offset-gray-800",
                  movablePawns.includes(pawn.id) && "animate-pulse"
                )}
                style={{ zIndex: 10 + index }}
                onClick={() => {
                  if (currentPlayer === pawn.player && movablePawns.includes(pawn.id)) {
                    setSelectedPawn(pawn.id);
                  }
                }}
              />
            ))}
          </div>
        );
      }
    }
    
    return (
      <div className="grid grid-cols-15 gap-0.5 bg-gray-800 p-2 rounded-lg">
        {board}
      </div>
    );
  };

  // Check for winner
  useEffect(() => {
    for (let player = 1; player <= 4; player++) {
      const playerFinished = pawns.filter(p => p.player === player && p.isFinished).length;
      if (playerFinished >= 4 && !winner) {
        setWinner(player as 1 | 2 | 3 | 4);
        setTimeout(() => onGameEnd(), 3000);
        return;
      }
    }
  }, [pawns, winner, onGameEnd]);

  // Update AI movement logic
  useEffect(() => {
    if (currentPlayer > 2 && !winner) {
      const aiTurn = setTimeout(() => {
        const aiPawns = pawns.filter(p => p.player === currentPlayer);
        const allPawnsInHome = aiPawns.every(p => p.isInHome);
        
        const roll = allPawnsInHome
          ? (Math.random() < 0.5 ? 6 : Math.floor(Math.random() * 5) + 1)
          : Math.floor(Math.random() * 6) + 1;
        
        setDiceValue(roll);
        
        const movablePawns = aiPawns.filter(pawn => {
          if (pawn.isFinished) return false;
          if (pawn.isInHome) return roll === 6;
          
          const newPosition = pawn.position + roll;
          if (newPosition > 52) {
            const adjustedPosition = newPosition - 52;
            return adjustedPosition <= 6;
          }
          return true;
        });

        if (movablePawns.length === 0) {
          generateCommentary({
            type: 'NO_MOVES',
            player: currentPlayer,
            diceRoll: roll
          });
          
          setTimeout(() => {
            setCurrentPlayer(currentPlayer === 4 ? 1 : (currentPlayer + 1) as 1 | 2 | 3 | 4);
            setDiceValue(null);
          }, 1000);
          return;
        }

        const selectedPawn = movablePawns[0];
        const fromPosition = selectedPawn.position;
        
        setTimeout(() => {
          setPawns(prev => {
            const newPawns = prev.map(pawn => {
              if (pawn.id === selectedPawn.id) {
                let newPosition = pawn.position;
                let newIsInHome = pawn.isInHome;
                let newIsFinished = pawn.isFinished;
                
                if (pawn.isInHome && roll === 6) {
                  newPosition = getStartPosition(pawn.player);
                  newIsInHome = false;
                  generateCommentary({
                    type: 'HOME',
                    player: currentPlayer,
                    diceRoll: roll,
                    pawnId: pawn.id
                  });
                } else if (!pawn.isInHome && !pawn.isFinished) {
                  newPosition = pawn.position + roll;
                  
                  if (newPosition > 52) {
                    const adjustedPosition = newPosition - 52;
                    if (adjustedPosition <= 6) {
                      newPosition = adjustedPosition;
                      if (adjustedPosition === 6) {
                        newIsFinished = true;
                        generateCommentary({
                          type: 'FINISH',
                          player: currentPlayer,
                          diceRoll: roll,
                          pawnId: pawn.id
                        });
                      }
                    } else {
                      return pawn;
                    }
                  }

                  const willCapture = prev.find(p => 
                    p.player !== currentPlayer && 
                    p.position === newPosition &&
                    !p.isInHome && 
                    !p.isFinished
                  );

                  if (willCapture) {
                    generateCommentary({
                      type: 'CAPTURE',
                      player: currentPlayer,
                      diceRoll: roll,
                      pawnId: pawn.id,
                      fromPosition,
                      toPosition: newPosition,
                      capturedPawn: willCapture
                    });
                  } else {
                    generateCommentary({
                      type: 'MOVE',
                      player: currentPlayer,
                      diceRoll: roll,
                      pawnId: pawn.id,
                      fromPosition,
                      toPosition: newPosition
                    });
                  }
                }
                
                return {
                  ...pawn,
                  position: newPosition,
                  isInHome: newIsInHome,
                  isFinished: newIsFinished
                };
              }
              return pawn;
            });

            return newPawns;
          });

          if (roll !== 6) {
            setCurrentPlayer(currentPlayer === 4 ? 1 : (currentPlayer + 1) as 1 | 2 | 3 | 4);
          }
          setDiceValue(null);
        }, 1000);
      }, 1000);

      return () => clearTimeout(aiTurn);
    }
  }, [currentPlayer, pawns, winner]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">⭐ LUDO ⭐</h1>
      
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          {/* Color Legend */}
          <div className="mb-4 flex gap-4 bg-gray-800/50 p-3 rounded-lg">
            {Object.entries(COLORS).map(([player, color]) => (
              <div key={player} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full bg-${color}-500`} />
                <span className="text-sm font-medium">
                  Player {player} {parseInt(player) <= 2 ? "(Human)" : "(AI)"}
                </span>
              </div>
            ))}
          </div>

          {renderBoard()}
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "text-2xl font-bold px-6 py-2 rounded-lg",
            `bg-${COLORS[currentPlayer]}-600/20`
          )}>
            Player {currentPlayer}'s Turn
          </div>
          
          {currentPlayer <= 2 && !winner && (
            <div className="text-center space-y-4">
              <button
                onClick={rollDice}
                disabled={isRolling || !!diceValue}
                className={cn(
                  "px-6 py-3 rounded-lg font-bold text-2xl transition-all",
                  isRolling || !!diceValue
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isRolling ? "Rolling..." : diceValue ? `Rolled: ${diceValue}` : "Roll Dice"}
              </button>

              {diceValue && (
                <div className="space-y-4">
                  <div className="bg-black/30 p-4 rounded-xl">
                    {getDiceIcon(diceValue)}
                  </div>
                  <div className="text-white text-lg font-bold">
                    You rolled a {diceValue}!
                  </div>
                  {movablePawns.length === 0 && (
                    <div className="space-y-2">
                      <div className="text-red-300">No moves available!</div>
                      <button
                        onClick={() => {
                          setDiceValue(null);
                          setCurrentPlayer(currentPlayer === 4 ? 1 : (currentPlayer + 1) as 1 | 2 | 3 | 4);
                          setMovablePawns([]);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
                      >
                        Skip Turn
                      </button>
                    </div>
                  )}
                </div>
              )}

              {diceValue && selectedPawn && (
                <button
                  onClick={movePawn}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-xl"
                >
                  Move Pawn
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {winner && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="text-center">
            <div className={cn(
              "text-6xl font-bold mb-4 animate-pulse",
              `text-${COLORS[winner]}-400`
            )}>
              Player {winner} Wins!
            </div>
            <div className="text-lg text-white/80">Returning to menu...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LudoGame; 