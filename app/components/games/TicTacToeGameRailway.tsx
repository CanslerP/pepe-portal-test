'use client';

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useActiveAccount } from "thirdweb/react";
import { type GameRoom } from '@/hooks/useGameRooms';
import { usePepeShells } from '@/hooks/usePepeShells';
import ConnectionStatus from '../ConnectionStatus';
import { useSocketIO } from '@/hooks/useSocketIO';

// Типы для крестиков-ноликов
type CellType = 'X' | 'O' | null;

interface TicTacToeMove {
  player: 'X' | 'O';
  position: { row: number; col: number };
  moveNumber: number;
  timestamp: Date;
}

interface TicTacToeGameState {
  board: CellType[][];
  currentPlayer: 'X' | 'O';
  moveHistory: TicTacToeMove[];
  moveNumber: number;
  gameStatus: 'playing' | 'finished';
  winner?: 'X' | 'O';
}

interface TicTacToeGameProps {
  gameRoom?: GameRoom;
}

// Стилизованные компоненты (упрощенные для демо)
const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const GameTitle = styled.h2`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: #00ffff;
  text-align: center;
  text-shadow: 0 0 10px #00ffff;
`;

const GameInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 400px;
  gap: 20px;
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

  ${props => props.isActive && `
    box-shadow: 0 0 20px #00ff00;
    animation: pulse 2s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 3px;
  width: 300px;
  height: 300px;
  background: #333;
  border-radius: 8px;
  padding: 3px;
`;

const Cell = styled(motion.div)<{ hasSymbol: boolean; isClickable?: boolean }>`
  background: #1a1a1a;
  border-radius: 4px;
  cursor: ${props => props.hasSymbol ? 'default' : props.isClickable ? 'pointer' : 'not-allowed'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 2rem;

  &:hover {
    background: ${props => 
      props.hasSymbol 
        ? '#1a1a1a' 
        : props.isClickable
          ? 'rgba(0, 255, 255, 0.2)' 
          : 'rgba(255, 0, 0, 0.1)'
    };
  }
`;

const Symbol = styled(motion.span)<{ symbol: 'X' | 'O' }>`
  color: ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'};
  text-shadow: 0 0 15px ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'};
`;

const StatusMessage = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  color: #00ff00;
  text-align: center;
  text-shadow: 0 0 10px #00ff00;
  margin-bottom: 10px;
`;

const OnlineStatus = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  color: #ffff00;
  text-align: center;
  margin: 10px 0;
`;

const NotificationPanel = styled(motion.div)<{ type: 'success' | 'error' | 'info' }>`
  background: ${props => 
    props.type === 'success' ? 'rgba(0, 255, 0, 0.2)' :
    props.type === 'error' ? 'rgba(255, 0, 0, 0.2)' :
    'rgba(0, 255, 255, 0.2)'
  };
  border: 2px solid ${props => 
    props.type === 'success' ? '#00ff00' :
    props.type === 'error' ? '#ff0000' :
    '#00ffff'
  };
  border-radius: 10px;
  padding: 15px;
  margin: 15px 0;
  text-align: center;
  font-family: 'Orbitron', monospace;
  color: ${props => 
    props.type === 'success' ? '#00ff00' :
    props.type === 'error' ? '#ff0000' :
    '#00ffff'
  };
`;

// 🚀 НОВЫЙ Railway-optimized компонент
export default function TicTacToeGameRailway({ gameRoom }: TicTacToeGameProps) {
  const account = useActiveAccount();
  const { balance, addShells, refreshBalance } = usePepeShells();
  
  const [board, setBoard] = useState<CellType[][]>(() => 
    Array(3).fill(null).map(() => Array(3).fill(null))
  );
  
  const [gameStats, setGameStats] = useState<TicTacToeGameState>({
    board: Array(3).fill(null).map(() => Array(3).fill(null)),
    currentPlayer: 'X',
    moveHistory: [],
    moveNumber: 0,
    gameStatus: 'playing'
  });

  const [isMyTurn, setIsMyTurn] = useState(false);
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [playersConnected, setPlayersConnected] = useState<string[]>([]);

  // 🔌 Socket.IO для real-time обновлений
  const {
    isConnected,
    isConnecting,
    gameState: socketGameState,
    sendGameAction
  } = useSocketIO({
    roomId: gameRoom?.id || '',
    onGameUpdate: (data) => {
      console.log('🎮 Real-time game update:', data);
      
      if (data.gameState) {
        setBoard(data.gameState.board);
        setGameStats(data.gameState);
        
        // Обновляем ход
        if (mySymbol) {
          setIsMyTurn(data.gameState.currentPlayer === mySymbol);
        }

        // Показываем уведомление об отменённом ходе
        if (data.undoMove) {
          setNotification(`🔄 Удален старый ход: ${data.undoMove.player} с позиции (${data.undoMove.position.row + 1}, ${data.undoMove.position.col + 1})`);
          setTimeout(() => setNotification(null), 3000);
        }
      }
    },
    onPlayerJoined: (data) => {
      console.log('👋 Player joined:', data.playerAddress);
      setNotification(`✅ ${data.playerAddress.slice(0, 6)}... присоединился к игре!`);
      setTimeout(() => setNotification(null), 3000);
    },
    onPlayerLeft: (data) => {
      console.log('👋 Player left:', data.playerAddress);
      setNotification(`❌ ${data.playerAddress.slice(0, 6)}... покинул игру`);
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification(`❌ Ошибка: ${error}`);
      setTimeout(() => setNotification(null), 3000);
    }
  });

  // Определяем символ игрока
  useEffect(() => {
    if (!gameRoom || !account?.address) return;
    
    if (gameRoom.creator === account.address) {
      setMySymbol('X');
      setIsMyTurn(gameStats.currentPlayer === 'X');
    } else if (gameRoom.opponent === account.address) {
      setMySymbol('O');
      setIsMyTurn(gameStats.currentPlayer === 'O');
    }
  }, [gameRoom, account, gameStats.currentPlayer]);

  // Обработка Socket.IO состояния
  useEffect(() => {
    if (socketGameState) {
      setBoard(socketGameState.board);
      setGameStats(socketGameState);
    }
  }, [socketGameState]);

  // Обработка завершения игры
  useEffect(() => {
    if (gameStats.gameStatus === 'finished' && gameStats.winner && mySymbol) {
      const isWinner = gameStats.winner === mySymbol;
      const betAmount = gameRoom?.betAmount || 0;
      
      if (isWinner) {
        const winnings = betAmount * 2;
        addShells(winnings, `Won tic-tac-toe game - prize ${winnings} SHELLS`);
        setNotification(`🎉 Победа! Вы выиграли ${winnings} PEPE SHELLS!`);
      } else {
        setNotification(`😞 Поражение! Вы потеряли ${betAmount} PEPE SHELLS.`);
      }
      
      refreshBalance();
      setTimeout(() => setNotification(null), 5000);
    }
  }, [gameStats.gameStatus, gameStats.winner, mySymbol, gameRoom, addShells, refreshBalance]);

  // 🎯 Мгновенный ход через Socket.IO
  const makeMove = useCallback(async (row: number, col: number) => {
    if (board[row][col] !== null || gameStats.gameStatus !== 'playing') return;
    if (!isMyTurn || !mySymbol || !gameRoom?.id || !account?.address) return;

    console.log('🎮 Making move via Socket.IO:', { row, col, mySymbol });

    // Оптимистичное обновление UI
    const optimisticBoard = board.map(r => [...r]);
    optimisticBoard[row][col] = mySymbol;
    setBoard(optimisticBoard);

    // Отправляем через Socket.IO
    const success = sendGameAction({
      action: 'makeMoveTicTacToe',
      move: { row, col }
    });

    if (!success) {
      // Откатываем оптимистичное обновление если сокет не подключен
      setBoard(board);
      setNotification('❌ Нет соединения с сервером');
      setTimeout(() => setNotification(null), 3000);
    }
  }, [board, gameStats, isMyTurn, mySymbol, gameRoom, account, sendGameAction]);

  const getGameStatus = () => {
    if (gameStats.gameStatus === 'finished') {
      if (gameStats.winner === mySymbol) {
        return 'Вы победили! 🎉';
      } else {
        return `Победил игрок ${gameStats.winner}`;
      }
    } else if (gameRoom?.status === 'waiting') {
      return 'Ожидание второго игрока...';
    } else if (isMyTurn) {
      return 'Ваш ход';
    } else {
      return `Ход игрока ${gameStats.currentPlayer}`;
    }
  };

  const getPlayerName = (symbol: 'X' | 'O') => {
    if (!gameRoom) return symbol;
    
    if (symbol === 'X') {
      return gameRoom.creatorName || 'Игрок X';
    } else {
      return gameRoom.opponentName || 'Игрок O';
    }
  };

  const canMakeMove = (row: number, col: number) => {
    return isMyTurn && 
           board[row][col] === null && 
           gameStats.gameStatus === 'playing' && 
           gameRoom?.status === 'playing' &&
           isConnected;
  };

  return (
    <GameContainer>
      {/* Real-time статус соединения */}
      <ConnectionStatus
        isConnected={isConnected}
        isRetrying={isConnecting}
        retryAttempt={0}
        error={!isConnected && !isConnecting ? 'Нет соединения с сервером' : ''}
      />
      
      <GameTitle>🚀 Real-time Tic-Tac-Toe</GameTitle>
      
      {/* Статус онлайн */}
      <OnlineStatus>
        🔌 {isConnected ? 'Подключено к серверу' : 'Переподключение...'} 
        | 👥 Игроков онлайн: {playersConnected.length}
      </OnlineStatus>
      
      {/* Уведомления */}
      {notification && (
        <NotificationPanel
          type={notification.includes('🎉') ? 'success' : notification.includes('❌') ? 'error' : 'info'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {notification}
        </NotificationPanel>
      )}

      {/* Информация об игроках */}
      <GameInfo>
        <PlayerInfo isActive={gameStats.currentPlayer === 'X'}>
          <div>{getPlayerName('X')}</div>
          <div style={{ color: '#ff0066', fontSize: '1.5rem' }}>X</div>
        </PlayerInfo>
        
        <div style={{ textAlign: 'center' }}>
          <StatusMessage>{getGameStatus()}</StatusMessage>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>
            Ход #{gameStats.moveNumber}
          </div>
        </div>
        
        <PlayerInfo isActive={gameStats.currentPlayer === 'O'}>
          <div>{getPlayerName('O')}</div>
          <div style={{ color: '#00ffff', fontSize: '1.5rem' }}>O</div>
        </PlayerInfo>
      </GameInfo>

      {/* Игровая доска */}
      <Board>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              hasSymbol={cell !== null}
              isClickable={canMakeMove(rowIndex, colIndex)}
              onClick={() => canMakeMove(rowIndex, colIndex) && makeMove(rowIndex, colIndex)}
              whileHover={canMakeMove(rowIndex, colIndex) ? { scale: 1.05 } : {}}
              whileTap={canMakeMove(rowIndex, colIndex) ? { scale: 0.95 } : {}}
            >
              {cell && (
                <Symbol
                  symbol={cell}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {cell}
                </Symbol>
              )}
            </Cell>
          ))
        )}
      </Board>
    </GameContainer>
  );
} 