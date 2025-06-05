'use client';

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useActiveAccount } from "thirdweb/react";
import GameChat from './GameChat';

// Типы и интерфейсы
type StoneType = 'black' | 'white' | null;
type GameState = 'playing' | 'finished';

interface Position {
  row: number;
  col: number;
}

interface GameStats {
  blackCaptures: number;
  whiteCaptures: number;
  currentPlayer: 'black' | 'white';
  gameState: GameState;
}

interface ChatMessage {
  id: string;
  player: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

interface GameRoom {
  id: string;
  creator: string;
  creatorName: string;
  betAmount: number;
  gameType: 'go' | 'chess' | 'tictactoe';
  status: 'waiting' | 'playing' | 'finished';
  opponent?: string;
  opponentName?: string;
  createdAt: Date;
  updatedAt?: Date;
  winner?: string;
  gameState?: {
    board: (string | null)[][];
    currentPlayer: 'black' | 'white';
    blackCaptures: number;
    whiteCaptures: number;
    moves: Array<{
      player: 'black' | 'white';
      row: number;
      col: number;
      timestamp: Date;
    }>;
    gameStatus: 'playing' | 'finished';
    winner?: string;
    messages: ChatMessage[];
  };
}

interface GoGameProps {
  gameRoom?: GameRoom;
}

// Стилизованные компоненты
const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(15px, 4vw, 30px);
  padding: 0 clamp(10px, 2vw, 20px);
`;

const GameMainArea = styled.div`
  display: flex;
  gap: clamp(15px, 4vw, 30px);
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 800px;

  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
    max-width: 500px;
  }

  @media (max-width: 600px) {
    gap: 15px;
  }
`;

const GameTitle = styled.h2`
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #00ffff;
  text-align: center;
  margin-bottom: 10px;
  text-shadow: 0 0 10px #00ffff;
`;

const GameInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  gap: clamp(10px, 3vw, 20px);
  margin-bottom: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const PlayerInfo = styled.div<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 2px solid ${props => props.isActive ? '#00ff00' : '#666'};
  border-radius: 10px;
  background: ${props => props.isActive ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)'};
  transition: all 0.3s ease;
  min-width: 120px;

  ${props => props.isActive && `
    box-shadow: 0 0 20px #00ff00;
    animation: pulse 2s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

const PlayerName = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  color: #ffffff;
  margin-bottom: 5px;
`;

const Captures = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  color: #ffff00;
  text-shadow: 0 0 5px #ffff00;
`;

const BoardContainer = styled.div`
  position: relative;
  background: linear-gradient(45deg, #2a2a2a, #1a1a1a);
  border: 3px solid #00ffff;
  border-radius: 15px;
  padding: clamp(10px, 3vw, 20px);
  box-shadow: 
    0 0 30px #00ffff,
    inset 0 0 30px rgba(0, 255, 255, 0.1);
  
  @media (max-width: 480px) {
    border-width: 2px;
    padding: 10px;
  }
`;

const Board = styled.div`
  position: relative;
  width: min(420px, 90vw);
  height: min(420px, 90vw);
  max-width: 420px;
  max-height: 420px;
  background: #D2B48C;
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 480px) {
    width: min(350px, 85vw);
    height: min(350px, 85vw);
  }
`;

const GridLine = styled.div<{ orientation: 'horizontal' | 'vertical', position: number }>`
  position: absolute;
  background: #8B4513;
  ${props => props.orientation === 'horizontal' ? `
    width: 100%;
    height: 2px;
    top: ${props.position * 20 + 30}px;
    left: 0;
  ` : `
    height: 100%;
    width: 2px;
    left: ${props.position * 20 + 30}px;
    top: 0;
  `}
`;

const Intersection = styled.div<{ hasStone: boolean; isClickable?: boolean }>`
  position: absolute;
  width: 24px;
  height: 24px;
  cursor: ${props => props.hasStone ? 'default' : (props.isClickable ?? true) ? 'pointer' : 'not-allowed'};
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => 
      props.hasStone 
        ? 'transparent' 
        : (props.isClickable ?? true)
          ? 'rgba(0, 255, 255, 0.2)' 
          : 'rgba(255, 0, 0, 0.1)'
    };
  }

  &:hover::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: ${props => 
      props.hasStone 
        ? 'transparent' 
        : (props.isClickable ?? true)
          ? '#00ffff' 
          : '#ff0000'
    };
    border-radius: 50%;
    opacity: ${props => props.hasStone ? '0' : '0.8'};
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const Stone = styled(motion.div)<{ color: 'black' | 'white' }>`
  position: absolute;
  top: 1px;
  left: 1px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${props => props.color === 'black' 
    ? 'radial-gradient(circle at 30% 30%, #444, #000)' 
    : 'radial-gradient(circle at 30% 30%, #fff, #ddd)'};
  border: 1px solid ${props => props.color === 'black' ? '#000' : '#ccc'};
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    ${props => props.color === 'black' ? '0 0 10px #000' : '0 0 10px #fff'};
  z-index: 10;
`;

const GameControls = styled.div`
  display: flex;
  gap: clamp(8px, 2vw, 15px);
  margin-top: 20px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 600px) {
    width: 100%;
    gap: 8px;
  }
`;

const GameButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary' 
    ? 'rgba(255, 255, 0, 0.2)' 
    : 'linear-gradient(45deg, #ff00ff, #00ffff)'};
  border: 1px solid ${props => props.variant === 'secondary' ? '#ffff00' : 'transparent'};
  border-radius: 8px;
  color: ${props => props.variant === 'secondary' ? '#ffff00' : '#000'};
  font-family: 'Orbitron', monospace;
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  padding: clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px);
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px ${props => props.variant === 'secondary' ? '#ffff00' : '#ff00ff'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 600px) {
    flex: 1;
    min-width: 120px;
  }
`;

const StatusMessage = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  color: #00ff00;
  text-align: center;
  text-shadow: 0 0 10px #00ff00;
  margin-bottom: 10px;
`;

// Основной компонент
export default function GoGame({ gameRoom }: GoGameProps) {
  const account = useActiveAccount();
  
  const [board, setBoard] = useState<StoneType[][]>(() => 
    Array(19).fill(null).map(() => Array(19).fill(null))
  );
  
  const [gameStats, setGameStats] = useState<GameStats>({
    blackCaptures: 0,
    whiteCaptures: 0,
    currentPlayer: 'black',
    gameState: 'playing'
  });

  const [gameHistory, setGameHistory] = useState<StoneType[][][]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [myColor, setMyColor] = useState<'black' | 'white' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Определяем цвет игрока
  useEffect(() => {
    if (!gameRoom || !account?.address) return;
    
    // Создатель игры играет черными (ходит первым)
    if (gameRoom.creator === account.address) {
      setMyColor('black');
      // Если игра только началась, черные ходят первыми
      setIsMyTurn(gameStats.currentPlayer === 'black');
      console.log('You are BLACK (creator)');
    } else if (gameRoom.opponent === account.address) {
      setMyColor('white');
      // Белые ждут своей очереди
      setIsMyTurn(gameStats.currentPlayer === 'white');
      console.log('You are WHITE (opponent)');
    }
  }, [gameRoom, account, gameStats.currentPlayer]);

  // Загружаем состояние игры и синхронизируем
  const loadGameState = useCallback(async () => {
    if (!gameRoom?.id) return;

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`);
      const data = await response.json();
      
      if (data.success && data.room.gameState) {
        const gameState = data.room.gameState;
        setBoard(gameState.board);
        setGameStats({
          blackCaptures: gameState.blackCaptures,
          whiteCaptures: gameState.whiteCaptures,
          currentPlayer: gameState.currentPlayer,
          gameState: gameState.gameStatus
        });
        
        // Проверяем, мой ли сейчас ход
        if (myColor) {
          const myTurn = gameState.currentPlayer === myColor;
          setIsMyTurn(myTurn);
          console.log(`Turn: ${gameState.currentPlayer} | Your turn: ${myTurn}`);
        }
      } else if (data.success && !data.room.gameState) {
        // Игра еще не начата, инициализируем начальное состояние
        setIsMyTurn(myColor === 'black'); // Черные ходят первыми
        console.log('Game starting - BLACK goes first');
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }, [gameRoom, myColor]);

  // Автоматическая синхронизация каждые 2 секунды
  useEffect(() => {
    if (!gameRoom?.id || !myColor) return;

    loadGameState();
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [loadGameState, gameRoom, myColor]);

  // Логика игры
  const getNeighbors = useCallback((row: number, col: number): Position[] => {
    const neighbors: Position[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 19 && newCol >= 0 && newCol < 19) {
        neighbors.push({ row: newRow, col: newCol });
      }
    });
    
    return neighbors;
  }, []);

  const getGroup = useCallback((board: StoneType[][], row: number, col: number): Position[] => {
    const visited = new Set<string>();
    const group: Position[] = [];
    const color = board[row][col];
    
    if (!color) return [];
    
    const dfs = (r: number, c: number) => {
      const key = `${r},${c}`;
      if (visited.has(key) || board[r][c] !== color) return;
      
      visited.add(key);
      group.push({ row: r, col: c });
      
      getNeighbors(r, c).forEach(({ row: nr, col: nc }) => {
        if (!visited.has(`${nr},${nc}`)) {
          dfs(nr, nc);
        }
      });
    };
    
    dfs(row, col);
    return group;
  }, [getNeighbors]);

  const hasLiberties = useCallback((board: StoneType[][], group: Position[]): boolean => {
    return group.some(({ row, col }) => 
      getNeighbors(row, col).some(({ row: nr, col: nc }) => 
        board[nr][nc] === null
      )
    );
  }, [getNeighbors]);

  const captureGroups = useCallback((board: StoneType[][], opponent: StoneType): Position[] => {
    const captured: Position[] = [];
    
    for (let row = 0; row < 19; row++) {
      for (let col = 0; col < 19; col++) {
        if (board[row][col] === opponent) {
          const group = getGroup(board, row, col);
          if (!hasLiberties(board, group)) {
            captured.push(...group);
          }
        }
      }
    }
    
    return captured;
  }, [getGroup, hasLiberties]);

  const makeMove = useCallback(async (row: number, col: number) => {
    // Отладка: показываем детали попытки хода
    console.log('Attempting move:', { row, col, isMyTurn, myColor, currentPlayer: gameStats.currentPlayer });

    // Проверяем основные условия
    if (board[row][col] !== null || gameStats.gameState !== 'playing') return;
    if (!isMyTurn || !myColor || !gameRoom?.id || !account?.address) return;
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'makeMove',
          player: account.address,
          move: { row, col }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Обновляем локальное состояние
        const gameState = data.gameState;
        setBoard(gameState.board);
        setGameStats({
          blackCaptures: gameState.blackCaptures,
          whiteCaptures: gameState.whiteCaptures,
          currentPlayer: gameState.currentPlayer,
          gameState: gameState.gameStatus
        });
        setIsMyTurn(gameState.currentPlayer === myColor);
        console.log('✓ Move successful - waiting for opponent');
      } else {
        console.error('Move failed:', data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error('Error making move:', error);
      alert('Ошибка при совершении хода');
    } finally {
      setIsLoading(false);
    }
  }, [board, gameStats, isMyTurn, myColor, gameRoom, account, isLoading]);

  // Отправка сообщения в чат
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!gameRoom?.id || !account?.address) return false;

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          player: account.address,
          message
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Немедленно загружаем обновленное состояние игры с новым сообщением
        await loadGameState();
      }
      
      return data.success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [gameRoom, account, loadGameState]);

  // Отмена игры (только для создателя в статусе 'waiting')
  const cancelGame = useCallback(async () => {
    if (!gameRoom?.id || !account?.address) return;
    if (gameRoom.status !== 'waiting') {
      alert('Игру можно отменить только до начала!');
      return;
    }
    if (gameRoom.creator !== account.address) {
      alert('Только создатель может отменить игру!');
      return;
    }
    if (!window.confirm('Вы уверены, что хотите отменить игру? Ставка будет возвращена.')) return;

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          player: account.address
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Игра отменена, ставка возвращена!');
        // Возвращаемся в лобби
        window.location.href = '/games';
      } else {
        alert('Ошибка при отмене игры: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling game:', error);
      alert('Ошибка при отмене игры');
    }
  }, [gameRoom, account]);

  // Заглушки для кнопок (в многопользовательской игре эти функции недоступны)
  const resetGame = useCallback(() => {
    alert('Новая игра недоступна в многопользовательском режиме. Вернитесь в лобби.');
  }, []);

  const undoMove = useCallback(() => {
    alert('Отмена хода недоступна в многопользовательской игре.');
  }, []);

  return (
    <GameContainer>
      <GameTitle>GO / ВЕЙЦИ</GameTitle>
      
      <StatusMessage>
        {!myColor ? (
          'Подключение к игре...'
        ) : isLoading ? (
          'Обработка хода...'
        ) : gameStats.gameState === 'finished' ? (
          `Игра завершена! Победитель: ${gameStats.currentPlayer === 'black' ? 'БЕЛЫЕ' : 'ЧЕРНЫЕ'}`
        ) : isMyTurn ? (
          `Ваш ход (${myColor === 'black' ? 'ЧЕРНЫЕ' : 'БЕЛЫЕ'})`
        ) : (
          `Ход противника (${gameStats.currentPlayer === 'black' ? 'ЧЕРНЫЕ' : 'БЕЛЫЕ'})`
        )}

      </StatusMessage>

      <GameInfo>
        <PlayerInfo isActive={gameStats.currentPlayer === 'black'}>
          <PlayerName>
            ЧЕРНЫЕ {gameRoom?.creator && myColor === 'black' ? '(Вы)' : gameRoom?.creatorName ? `(${gameRoom.creatorName})` : ''}
          </PlayerName>
          <Captures>Захвачено: {gameStats.blackCaptures}</Captures>
        </PlayerInfo>
        
        <PlayerInfo isActive={gameStats.currentPlayer === 'white'}>
          <PlayerName>
            БЕЛЫЕ {gameRoom?.opponent && myColor === 'white' ? '(Вы)' : gameRoom?.opponentName ? `(${gameRoom.opponentName})` : ''}
          </PlayerName>
          <Captures>Захвачено: {gameStats.whiteCaptures}</Captures>
        </PlayerInfo>
      </GameInfo>

      <GameMainArea>
        <BoardContainer>
          <Board>
            {/* Горизонтальные линии */}
            {Array.from({ length: 19 }, (_, i) => (
              <GridLine key={`h-${i}`} orientation="horizontal" position={i} />
            ))}
            
            {/* Вертикальные линии */}
            {Array.from({ length: 19 }, (_, i) => (
              <GridLine key={`v-${i}`} orientation="vertical" position={i} />
            ))}
            
            {/* Пересечения */}
            {board.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <Intersection
                  key={`${rowIdx}-${colIdx}`}
                  hasStone={cell !== null}
                  isClickable={cell === null && isMyTurn && gameStats.gameState === 'playing' && !isLoading}
                  onClick={() => makeMove(rowIdx, colIdx)}
                  style={{
                    top: `${rowIdx * 20 + 30 - 12}px`,
                    left: `${colIdx * 20 + 30 - 12}px`
                  }}
                >
                  {cell && (
                    <Stone
                      color={cell}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20 
                      }}
                    />
                  )}
                </Intersection>
              ))
            )}
          </Board>
        </BoardContainer>

        {/* Чат игры */}
        {gameRoom && gameRoom.status === 'playing' && (
          <GameChat
            gameRoomId={gameRoom.id}
            messages={gameRoom.gameState?.messages || []}
            onSendMessage={sendMessage}
          />
        )}
      </GameMainArea>

      <GameControls>
        {/* Кнопка отмены игры - только для создателя в статусе 'waiting' */}
        {gameRoom && gameRoom.status === 'waiting' && gameRoom.creator === account?.address && (
          <GameButton 
            variant="secondary"
            onClick={cancelGame}
          >
            Отменить игру
          </GameButton>
        )}

        <GameButton onClick={resetGame} disabled={gameRoom !== undefined}>
          Новая игра
        </GameButton>
        <GameButton 
          variant="secondary" 
          onClick={undoMove}
          disabled={gameRoom !== undefined}
        >
          Отменить ход
        </GameButton>
        
        {/* Кнопка сдачи - только во время игры */}
        {gameRoom && gameRoom.status === 'playing' && (
          <GameButton 
            variant="secondary"
            onClick={async () => {
              if (!gameRoom?.id || !account?.address || !window.confirm('Вы уверены, что хотите сдаться?')) return;
              
              try {
                const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    action: 'surrender',
                    player: account.address
                  })
                });

                const data = await response.json();
                if (data.success) {
                  setGameStats(prev => ({
                    ...prev,
                    gameState: 'finished'
                  }));
                  alert('Вы сдались. Игра завершена.');
                }
              } catch (error) {
                console.error('Error surrendering:', error);
              }
            }}
            disabled={gameStats.gameState === 'finished'}
          >
            Сдаться
          </GameButton>
        )}
      </GameControls>
    </GameContainer>
  );
} 