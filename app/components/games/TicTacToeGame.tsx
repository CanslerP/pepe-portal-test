'use client';

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useActiveAccount } from "thirdweb/react";
import { type GameRoom } from '@/hooks/useGameRooms';
import { usePepeShells } from '@/hooks/usePepeShells';
import ConnectionStatus from '../ConnectionStatus';
import { apiClient } from '@/lib/apiClient';
import GameChat from './GameChat';

// Типы и интерфейсы для крестиков-ноликов
type CellType = 'X' | 'O' | null;
type TicTacToeGameState = 'playing' | 'finished';

interface Position {
  row: number;
  col: number;
}

interface TicTacToeMove {
  player: 'X' | 'O';
  position: Position;
  moveNumber: number;
  timestamp: Date;
}

interface TicTacToeStats {
  currentPlayer: 'X' | 'O';
  gameState: TicTacToeGameState;
  winner?: 'X' | 'O';
  moveHistory: TicTacToeMove[];
  moveNumber: number;
}

interface TicTacToeGameProps {
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
  max-width: 400px;
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

const PlayerSymbol = styled.div<{ symbol: 'X' | 'O' }>`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'};
  text-shadow: 0 0 10px ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'};
`;

const BoardContainer = styled.div`
  position: relative;
  background: linear-gradient(45deg, #2a2a2a, #1a1a1a);
  border: 3px solid #00ffff;
  border-radius: 15px;
  padding: clamp(15px, 4vw, 25px);
  box-shadow: 
    0 0 30px #00ffff,
    inset 0 0 30px rgba(0, 255, 255, 0.1);
  
  @media (max-width: 480px) {
    border-width: 2px;
    padding: 15px;
  }
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 3px;
  width: min(300px, 80vw);
  height: min(300px, 80vw);
  max-width: 300px;
  max-height: 300px;
  background: #333;
  border-radius: 8px;
  padding: 3px;
  
  @media (max-width: 480px) {
    width: min(250px, 75vw);
    height: min(250px, 75vw);
  }
`;

const Cell = styled(motion.div)<{ hasSymbol: boolean; isClickable?: boolean; willBeRemoved?: boolean }>`
  background: #1a1a1a;
  border-radius: 4px;
  cursor: ${props => props.hasSymbol ? 'default' : (props.isClickable ?? true) ? 'pointer' : 'not-allowed'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(1.5rem, 6vw, 2.5rem);
  position: relative;

  &:hover {
    background: ${props => 
      props.hasSymbol 
        ? '#1a1a1a' 
        : (props.isClickable ?? true)
          ? 'rgba(0, 255, 255, 0.2)' 
          : 'rgba(255, 0, 0, 0.1)'
    };
  }

  ${props => props.hasSymbol && `
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      border-radius: 4px;
    }
  `}

  ${props => props.willBeRemoved && `
    border: 2px solid #ff4444;
    box-shadow: 0 0 15px rgba(255, 68, 68, 0.6);
    animation: removeWarning 1.5s ease-in-out infinite;
    
    @keyframes removeWarning {
      0%, 100% { 
        border-color: #ff4444;
        box-shadow: 0 0 15px rgba(255, 68, 68, 0.6);
      }
      50% { 
        border-color: #ff8888;
        box-shadow: 0 0 25px rgba(255, 68, 68, 0.9);
      }
    }
  `}
`;

const Symbol = styled(motion.span)<{ symbol: 'X' | 'O' }>`
  color: ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'};
  text-shadow: 0 0 15px ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'};
  filter: drop-shadow(0 0 10px ${props => props.symbol === 'X' ? '#ff0066' : '#00ffff'});
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
  min-height: 24px;
`;

const MoveInfo = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  color: #ffff00;
  text-align: center;
  text-shadow: 0 0 5px #ffff00;
  margin-bottom: 10px;
`;

const UndoAlert = styled(motion.div)`
  background: rgba(255, 255, 0, 0.2);
  border: 2px solid #ffff00;
  border-radius: 10px;
  padding: 15px;
  margin: 10px 0;
  text-align: center;
  font-family: 'Orbitron', monospace;
  color: #ffff00;
  text-shadow: 0 0 10px #ffff00;
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
`;

const GameInfoPanel = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ffff;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  font-family: 'Orbitron', monospace;
  text-align: center;
`;

const BetInfo = styled.div`
  color: #FFD700;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 10px;
  
  .bet-amount {
    color: #00ff00;
    text-shadow: 0 0 10px #00ff00;
  }
  
  .potential-win {
    color: #ff00ff;
    text-shadow: 0 0 10px #ff00ff;
  }
`;

const WinMessage = styled(motion.div)`
  background: linear-gradient(45deg, rgba(0, 255, 0, 0.3), rgba(255, 215, 0, 0.3));
  border: 3px solid #00ff00;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  text-align: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #ffffff;
  text-shadow: 0 0 15px #00ff00;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
`;

const DefeatMessage = styled(motion.div)`
  background: linear-gradient(45deg, rgba(255, 0, 0, 0.3), rgba(128, 128, 128, 0.3));
  border: 3px solid #ff0000;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  text-align: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #ffffff;
  text-shadow: 0 0 15px #ff0000;
  box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
`;

const NewGamePanel = styled.div`
  background: rgba(255, 255, 0, 0.1);
  border: 2px solid #ffff00;
  border-radius: 10px;
  padding: 15px;
  margin: 15px 0;
  text-align: center;
  font-family: 'Orbitron', monospace;
  color: #ffff00;
`;

const ConfirmButton = styled.button`
  background: linear-gradient(45deg, #00ff00, #00ffff);
  border: 1px solid #00ff00;
  border-radius: 8px;
  color: #000;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 10px 20px;
  margin: 0 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }
`;

const DeclineButton = styled.button`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid #ff0000;
  border-radius: 8px;
  color: #ff0000;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 10px 20px;
  margin: 0 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;

  &:hover {
    background: rgba(255, 0, 0, 0.3);
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
  }
`;

const NewGameDialog = styled(motion.div)`
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #ffff00;
  border-radius: 15px;
  padding: 25px;
  margin: 15px 0;
  text-align: center;
  font-family: 'Orbitron', monospace;
  color: #ffff00;
  box-shadow: 0 0 30px rgba(255, 255, 0, 0.3);
`;

const BetInput = styled.input`
  background: rgba(255, 255, 0, 0.1);
  border: 2px solid #ffff00;
  border-radius: 8px;
  color: #ffff00;
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  text-align: center;
  padding: 10px 15px;
  margin: 10px;
  width: 100px;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
  }
`;

const BetButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 15px 0;
`;

const BetPresetButton = styled.button`
  background: rgba(0, 255, 255, 0.2);
  border: 1px solid #00ffff;
  border-radius: 6px;
  color: #00ffff;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.3);
    transform: scale(1.05);
  }
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
  box-shadow: 0 0 20px ${props => 
    props.type === 'success' ? 'rgba(0, 255, 0, 0.3)' :
    props.type === 'error' ? 'rgba(255, 0, 0, 0.3)' :
    'rgba(0, 255, 255, 0.3)'
  };
`;

// Основной компонент
export default function TicTacToeGame({ gameRoom }: TicTacToeGameProps) {
  const account = useActiveAccount();
  const { balance, addShells, deductShells, refreshBalance } = usePepeShells();


  
  const [board, setBoard] = useState<CellType[][]>(() => 
    Array(3).fill(null).map(() => Array(3).fill(null))
  );
  
  const [gameStats, setGameStats] = useState<TicTacToeStats>({
    currentPlayer: 'X',
    gameState: 'playing',
    moveHistory: [],
    moveNumber: 0
  });

  // Состояния для отслеживания соединения
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: true,
    isRetrying: false,
    retryAttempt: 0,
    error: ''
  });

  const [isMyTurn, setIsMyTurn] = useState(false);
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUndoMove, setLastUndoMove] = useState<TicTacToeMove | null>(null);
  const [disappearingCells, setDisappearingCells] = useState<Set<string>>(new Set());
  const [nextToRemoveCell, setNextToRemoveCell] = useState<string | null>(null);
  const [gameEndHandled, setGameEndHandled] = useState(false);
  const [newGameRequest, setNewGameRequest] = useState<string | null>(null); // Кто запросил новую игру
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [newGameBet, setNewGameBet] = useState(gameRoom?.betAmount || 10);
  const [notification, setNotification] = useState<string | null>(null);

  // Определяем символ игрока
  useEffect(() => {
    if (!gameRoom || !account?.address) return;
    
    // Создатель игры играет X (ходит первым)
    if (gameRoom.creator === account.address) {
      setMySymbol('X');
      setIsMyTurn(gameStats.currentPlayer === 'X');
      console.log('You are X (creator)');
    } else if (gameRoom.opponent === account.address) {
      setMySymbol('O');
      setIsMyTurn(gameStats.currentPlayer === 'O');
      console.log('You are O (opponent)');
    }
  }, [gameRoom, account, gameStats.currentPlayer]);

  // Загружаем состояние игры и синхронизируем
  const loadGameState = useCallback(async () => {
    if (!gameRoom?.id) return;

    try {
      // Обновляем статус соединения
      setConnectionStatus(prev => ({ ...prev, isRetrying: true, error: '' }));
      
      const result = await apiClient.getGameRoom(gameRoom.id);
      
      if (result.success && result.data?.room) {
        const room = result.data.room;
        
        // Успешное соединение
        setConnectionStatus({
          isConnected: true,
          isRetrying: false,
          retryAttempt: 0,
          error: ''
        });
        
        if (room.gameState) {
          const gameState = room.gameState;
          setBoard(gameState.board);
          setGameStats({
            currentPlayer: gameState.currentPlayer,
            gameState: gameState.gameStatus,
            winner: gameState.winner,
            moveHistory: gameState.moveHistory || [],
            moveNumber: gameState.moveNumber || 0
          });
          
          // Синхронизируем запрос новой игры
          setNewGameRequest(gameState.newGameRequest || null);
          
          // Обновляем ставку новой игры если есть запрос
          if (gameState.newGameBet) {
            setNewGameBet(gameState.newGameBet);
          }
          
          // Проверяем уведомления об отклонении
          if (gameState.declineNotification && gameState.declineNotification === account?.address) {
            setNotification('🚫 Оппонент отклонил ваш запрос новой игры');
            // Очищаем уведомление через 5 секунд
            setTimeout(() => setNotification(null), 5000);
          }
          
          // Проверяем, мой ли сейчас ход
          if (mySymbol) {
            const myTurn = gameState.currentPlayer === mySymbol;
            setIsMyTurn(myTurn);
            console.log(`Turn: ${gameState.currentPlayer} | Your turn: ${myTurn}`);
          }
        } else {
          // Игра еще не начата, инициализируем начальное состояние
          setIsMyTurn(mySymbol === 'X'); // X ходит первым
          console.log('Game starting - X goes first');
        }
      } else {
        // Ошибка получения данных
        setConnectionStatus({
          isConnected: false,
          isRetrying: false,
          retryAttempt: 0,
          error: result.error || 'Не удалось загрузить данные игры'
        });
      }
    } catch (error: any) {
      console.error('Error loading game state:', error);
      setConnectionStatus({
        isConnected: false,
        isRetrying: false,
        retryAttempt: 0,
        error: 'Ошибка соединения'
      });
    }
  }, [gameRoom, mySymbol, account?.address]);

  // 🔄 Оптимизированная синхронизация без SSE (безопасно для Vercel)
  useEffect(() => {
    if (!gameRoom?.id || !mySymbol) return;

    let timeoutId: NodeJS.Timeout | null = null;
          let intervalTime = 1500; // Более быстрая синхронизация
    let lastMoveNumber = gameStats.moveNumber;
    
    const sync = async () => {
      try {
        await loadGameState();
        
        // Если есть изменения, делаем быструю проверку через 1 сек
        if (gameStats.moveNumber !== lastMoveNumber) {
          lastMoveNumber = gameStats.moveNumber;
          intervalTime = 1000; // Быстро проверяем после изменений
        } else {
          // Нет изменений - увеличиваем интервал
          intervalTime = gameStats.gameState === 'finished' ? 10000 : 3000;
        }
        
        timeoutId = setTimeout(sync, intervalTime);
      } catch (error) {
        console.error('Sync error:', error);
        timeoutId = setTimeout(sync, 5000); // При ошибке ждем 5 сек
      }
    };

    // Начальная загрузка
    loadGameState().then(() => {
      timeoutId = setTimeout(sync, intervalTime);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [gameRoom?.id, mySymbol, loadGameState, gameStats.moveNumber, gameStats.gameState]);

  // Определяем символ, который будет удалён следующим
  useEffect(() => {
    const symbolsOnBoard = board.flat().filter(cell => cell !== null).length;
    
    if (symbolsOnBoard >= 6 && isMyTurn && gameStats.moveHistory.length > 0) {
      // Показываем подсветку самого старого символа (который будет удалён)
      const oldestMove = gameStats.moveHistory[0];
      const cellKey = `${oldestMove.position.row}-${oldestMove.position.col}`;
      setNextToRemoveCell(cellKey);
    } else {
      setNextToRemoveCell(null);
    }
  }, [board, isMyTurn, gameStats.moveHistory]);

  // Обработка завершения игры с выплатами
  useEffect(() => {
    if (!gameRoom || !account?.address || !mySymbol) return;
    if (gameStats.gameState !== 'finished' || gameEndHandled) return;
    
    const handleGameEnd = async () => {
      setGameEndHandled(true);
      setShowWinMessage(true);
      
      const betAmount = gameRoom.betAmount;
      const isWinner = gameStats.winner === mySymbol;
      
      if (isWinner) {
        // Победитель получает удвоенную ставку (свою + ставку оппонента)
        const winnings = betAmount * 2;
        const success = await addShells(winnings, `Won tic-tac-toe game - prize ${winnings} SHELLS`);
        if (success) {
          console.log(`🎉 Victory! You won ${winnings} PEPE SHELLS!`);
        }
      } else {
        console.log(`😞 Defeat! You lost ${betAmount} PEPE SHELLS bet.`);
      }
      
      // Обновляем баланс для отображения
      await refreshBalance();
      
      // Скрываем сообщение о победе через 5 секунд
      setTimeout(() => {
        setShowWinMessage(false);
      }, 5000);
    };
    
    handleGameEnd();
  }, [gameStats.gameState, gameStats.winner, gameRoom, account, mySymbol, gameEndHandled, addShells, refreshBalance]);

  // Проверка победы (ничьи больше не существует)
  const checkWin = useCallback((board: CellType[][]): 'X' | 'O' | null => {
    // Проверяем горизонтали
    for (let row = 0; row < 3; row++) {
      if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
        return board[row][0];
      }
    }

    // Проверяем вертикали
    for (let col = 0; col < 3; col++) {
      if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
        return board[0][col];
      }
    }

    // Проверяем диагонали
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }

    // Ничьи больше не существует - игра продолжается до победы
    return null;
  }, []);

  // Обработка хода с механикой автоотката на 5-м ходу
  const makeMove = useCallback(async (row: number, col: number) => {
    console.log('Attempting move:', { row, col, isMyTurn, mySymbol, currentPlayer: gameStats.currentPlayer });

    // Проверяем основные условия
    if (board[row][col] !== null || gameStats.gameState !== 'playing') return;
    if (!isMyTurn || !mySymbol || !gameRoom?.id || !account?.address) return;
    if (isLoading) return;

    setIsLoading(true);
    
    // Показываем оптимистичное обновление UI
    const optimisticBoard = board.map(row => [...row]);
    optimisticBoard[row][col] = mySymbol;
    setBoard(optimisticBoard);

    try {
      setConnectionStatus(prev => ({ ...prev, isRetrying: true, error: '' }));

      const result = await apiClient.gameAction(gameRoom.id, {
        action: 'makeMoveTicTacToe',
        player: account.address,
        move: { row, col }
      });
      
      if (result.success && result.data) {
        setConnectionStatus({
          isConnected: true,
          isRetrying: false,
          retryAttempt: 0,
          error: ''
        });

        // Обновляем состояние игры от сервера
        const gameState = result.data.gameState;
        setBoard(gameState.board);
        setGameStats({
          currentPlayer: gameState.currentPlayer,
          gameState: gameState.gameStatus,
          winner: gameState.winner,
          moveHistory: gameState.moveHistory || [],
          moveNumber: gameState.moveNumber || 0
        });
        setIsMyTurn(gameState.currentPlayer === mySymbol);
        
        // Убираем подсветку после хода
        setNextToRemoveCell(null);

        // Показываем информацию об отменённом ходе
        if (result.data.undoMove) {
          setLastUndoMove(result.data.undoMove);
          setTimeout(() => setLastUndoMove(null), 2000);
        }
        
        console.log('✓ Move successful', gameState.moveNumber > 0 ? `- move #${gameState.moveNumber}` : '');
      } else {
        // Откатываем оптимистичное обновление
        setBoard(board);
        
        setConnectionStatus({
          isConnected: false,
          isRetrying: false,
          retryAttempt: 0,
          error: result.error || 'Ошибка выполнения хода'
        });
        
        console.error('Move failed:', result.error);
        setNotification(result.error || 'Ошибка при выполнении хода');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error: any) {
      // Откатываем оптимистичное обновление
      setBoard(board);
      
      setConnectionStatus({
        isConnected: false,
        isRetrying: false,
        retryAttempt: 0,
        error: 'Ошибка соединения'
      });
      
      console.error('Error making move:', error);
      setNotification('Проблемы с соединением. Ход не выполнен.');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [board, gameStats, isMyTurn, mySymbol, gameRoom, account, isLoading]);

  // Сброс игры
  const resetGame = useCallback(async () => {
    if (!gameRoom?.id || !account?.address) return;

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resetGame',
          player: account.address
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
        setGameStats({
          currentPlayer: 'X',
          gameState: 'playing',
          moveHistory: [],
          moveNumber: 0
        });
        setIsMyTurn(mySymbol === 'X');
        setLastUndoMove(null);
        setNextToRemoveCell(null);
        setDisappearingCells(new Set());
        console.log('Game reset successfully');
      }
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  }, [gameRoom, account, mySymbol]);

  // Запрос новой игры с выбранной ставкой
  const requestNewGameWithBet = useCallback(async (betAmount: number) => {
    if (!gameRoom?.id || !account?.address) return;
    
    // Проверяем достаточность средств для новой ставки
    if (balance < betAmount) {
      alert(`Недостаточно PEPE SHELLS для новой игры! Нужно ${betAmount}, у вас ${balance}`);
      return;
    }

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'requestNewGame',
          player: account.address,
          betAmount: betAmount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewGameRequest(account.address);
        setShowNewGameDialog(false);
        console.log('New game requested with bet:', betAmount);
      } else {
        alert(data.error || 'Ошибка при запросе новой игры');
      }
    } catch (error) {
      console.error('Error requesting new game:', error);
      alert('Ошибка соединения');
    }
  }, [gameRoom, account, balance]);

  // Показать диалог новой игры
  const showNewGameRequest = useCallback(() => {
    setNewGameBet(gameRoom?.betAmount || 10);
    setShowNewGameDialog(true);
  }, [gameRoom]);

  // Отменить диалог новой игры
  const cancelNewGameDialog = useCallback(() => {
    setShowNewGameDialog(false);
  }, []);

  // Подтверждение новой игры
  const confirmNewGame = useCallback(async () => {
    if (!gameRoom?.id || !account?.address) return;
    
    // Проверяем достаточность средств для новой ставки
    if (balance < newGameBet) {
      alert(`Недостаточно PEPE SHELLS для новой игры! Нужно ${newGameBet}, у вас ${balance}`);
      return;
    }

    try {
      // Списываем ставку
      const success = await deductShells(newGameBet, 'New tic-tac-toe game bet');
      if (!success) {
        alert('Не удалось списать ставку!');
        return;
      }

      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'confirmNewGame',
          player: account.address
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Сбрасываем состояние игры
        setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
        setGameStats({
          currentPlayer: 'X',
          gameState: 'playing',
          moveHistory: [],
          moveNumber: 0
        });
        setIsMyTurn(mySymbol === 'X');
        setLastUndoMove(null);
        setNextToRemoveCell(null);
        setDisappearingCells(new Set());
        setGameEndHandled(false);
        setNewGameRequest(null);
        setShowWinMessage(false);
        console.log('New game confirmed and started');
      } else {
        // Если подтверждение не удалось, возвращаем ставку
        await addShells(newGameBet, 'New game confirmation failed - refund');
        alert(data.error || 'Ошибка при подтверждении новой игры');
      }
    } catch (error) {
      console.error('Error confirming new game:', error);
      // Возвращаем ставку при ошибке
      await addShells(newGameBet, 'New game confirmation error - refund');
      alert('Ошибка соединения');
    }
  }, [gameRoom, account, balance, deductShells, addShells, mySymbol, newGameBet]);

  // Отклонение новой игры
  const declineNewGame = useCallback(async () => {
    if (!gameRoom?.id || !account?.address) return;

    try {
      const response = await fetch(`/api/game-rooms/${gameRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'declineNewGame',
          player: account.address
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewGameRequest(null);
        console.log('New game declined');
      }
    } catch (error) {
      console.error('Error declining new game:', error);
    }
  }, [gameRoom, account]);

  // Получение статуса игры
  const getGameStatus = () => {
    if (gameStats.gameState === 'finished') {
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

  // Получение имени игрока по символу
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
           gameStats.gameState === 'playing' && 
           gameRoom?.status === 'playing';
  };

  return (
    <GameContainer>
      {/* Статус соединения */}
      <ConnectionStatus
        isConnected={connectionStatus.isConnected}
        isRetrying={connectionStatus.isRetrying}
        retryAttempt={connectionStatus.retryAttempt}
        error={connectionStatus.error}
      />
      
      <GameTitle>Evolving Tic-Tac-Toe</GameTitle>
      
      {/* Уведомления */}
      {notification && (
        <NotificationPanel
          type="error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {notification}
        </NotificationPanel>
      )}

      {/* Диалог выбора ставки для новой игры */}
      {showNewGameDialog && (
        <NewGameDialog
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <h3 style={{ margin: '0 0 20px 0' }}>🎮 Новая игра</h3>
          <div style={{ marginBottom: '15px' }}>
            Выберите размер ставки:
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <BetInput
              type="number"
              min="5"
              max="1000"
              value={newGameBet}
              onChange={(e) => setNewGameBet(Math.max(5, parseInt(e.target.value) || 5))}
            />
            <div style={{ fontSize: '0.8rem', color: '#ffff00', marginTop: '5px' }}>
              PEPE SHELLS
            </div>
          </div>

          <BetButtonContainer>
            <BetPresetButton onClick={() => setNewGameBet(10)}>
              10 SHELLS
            </BetPresetButton>
            <BetPresetButton onClick={() => setNewGameBet(25)}>
              25 SHELLS
            </BetPresetButton>
            <BetPresetButton onClick={() => setNewGameBet(50)}>
              50 SHELLS
            </BetPresetButton>
            <BetPresetButton onClick={() => setNewGameBet(100)}>
              100 SHELLS
            </BetPresetButton>
          </BetButtonContainer>

          <div style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
            🏆 Потенциальный выигрыш: <span style={{ color: '#00ff00' }}>{newGameBet * 2} SHELLS</span>
          </div>

          <div>
            <ConfirmButton 
              onClick={() => requestNewGameWithBet(newGameBet)}
              disabled={balance < newGameBet}
            >
              {balance < newGameBet ? 'Недостаточно средств' : 'Отправить запрос'}
            </ConfirmButton>
            <DeclineButton onClick={cancelNewGameDialog}>
              Отмена
            </DeclineButton>
          </div>
        </NewGameDialog>
      )}

      {/* Информация о ставке */}
      {gameRoom && (
        <GameInfoPanel>
          <BetInfo>
            🐚 Ставка: <span className="bet-amount">{gameRoom.betAmount} PEPE SHELLS</span>
            <br />
            🏆 Приз: <span className="potential-win">{gameRoom.betAmount * 2} PEPE SHELLS</span>
            <br />
            💰 Ваш баланс: <span style={{ color: '#00ffff' }}>{balance} SHELLS</span>
          </BetInfo>
        </GameInfoPanel>
      )}

      {gameRoom?.status === 'playing' && gameStats.gameState === 'playing' && (
        <StatusMessage style={{ fontSize: '1.2rem', color: gameStats.currentPlayer === 'X' ? '#ff0066' : '#00ffff' }}>
          Next player: {gameStats.currentPlayer}
        </StatusMessage>
      )}
      
      <GameInfo>
        <PlayerInfo isActive={gameStats.currentPlayer === 'X'}>
          <PlayerName>{getPlayerName('X')}</PlayerName>
          <PlayerSymbol symbol="X">X</PlayerSymbol>
        </PlayerInfo>
        
        <PlayerInfo isActive={gameStats.currentPlayer === 'O'}>
          <PlayerName>{getPlayerName('O')}</PlayerName>
          <PlayerSymbol symbol="O">O</PlayerSymbol>
        </PlayerInfo>
      </GameInfo>

      {/* Сообщения о победе/поражении */}
      {showWinMessage && gameStats.gameState === 'finished' && (
        <>
          {gameStats.winner === mySymbol ? (
            <WinMessage
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              🎉 ПОБЕДА! 🎉<br />
              Вы выиграли {gameRoom ? gameRoom.betAmount * 2 : 0} PEPE SHELLS!
            </WinMessage>
          ) : (
            <DefeatMessage
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              😞 Поражение<br />
              Вы потеряли {gameRoom ? gameRoom.betAmount : 0} PEPE SHELLS
            </DefeatMessage>
          )}
        </>
      )}

      {gameRoom?.status !== 'playing' || gameStats.gameState === 'finished' ? (
        <StatusMessage>{getGameStatus()}</StatusMessage>
      ) : null}

      {/* Панель запроса новой игры */}
      {gameStats.gameState === 'finished' && (
        <>
          {newGameRequest && newGameRequest !== account?.address ? (
            <NewGamePanel>
              <div style={{ marginBottom: '15px' }}>
                🎮 Оппонент предлагает новую игру за <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{newGameBet} PEPE SHELLS</span>
                {newGameBet !== gameRoom?.betAmount && (
                  <div style={{ fontSize: '0.8rem', color: '#ffff00', marginTop: '5px' }}>
                    (было: {gameRoom?.betAmount} SHELLS)
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: '15px', color: '#00ffff' }}>
                🏆 Потенциальный выигрыш: {newGameBet * 2} SHELLS
              </div>
              <div>
                <ConfirmButton 
                  onClick={confirmNewGame}
                  disabled={balance < newGameBet}
                >
                  {balance < newGameBet ? 'Недостаточно средств' : 'Принять'}
                </ConfirmButton>
                <DeclineButton onClick={declineNewGame}>
                  Отклонить
                </DeclineButton>
              </div>
            </NewGamePanel>
          ) : newGameRequest === account?.address ? (
            <NewGamePanel>
              <div>⏳ Ожидание подтверждения от оппонента...</div>
              <div style={{ marginTop: '10px' }}>
                <DeclineButton onClick={declineNewGame}>
                  Отменить запрос
                </DeclineButton>
              </div>
            </NewGamePanel>
          ) : null}
        </>
      )}
      
      <MoveInfo style={{ 
        color: (board.flat().filter(cell => cell !== null).length >= 6 && isMyTurn && nextToRemoveCell) 
          ? '#ff4444' 
          : '#ffff00'
      }}>
        {(() => {
          const symbolsOnBoard = board.flat().filter(cell => cell !== null).length;
          if (symbolsOnBoard >= 6 && isMyTurn && nextToRemoveCell) {
            const oldestMove = gameStats.moveHistory[0];
            const position = `(${oldestMove.position.row + 1}, ${oldestMove.position.col + 1})`;
            return `⚠️ Ваш ход удалит символ ${oldestMove.player} с позиции ${position}`;
          } else if (symbolsOnBoard >= 6) {
            return `На доске: ${symbolsOnBoard}/9 символов | 🔄 Удаление старейших ходов активно`;
          } else if (symbolsOnBoard >= 4) {
            return `На доске: ${symbolsOnBoard}/9 символов | Скоро начнётся удаление старых ходов`;
          } else {
            return `На доске: ${symbolsOnBoard}/9 символов | Поле заполняется`;
          }
        })()}
      </MoveInfo>

              {lastUndoMove && (
          <UndoAlert
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            🔄 Первый ход удалён! Символ {lastUndoMove.player} исчез с позиции ({lastUndoMove.position.row + 1}, {lastUndoMove.position.col + 1})
          </UndoAlert>
        )}

      <GameMainArea>
        <BoardContainer>
          <Board>
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  hasSymbol={cell !== null}
                  isClickable={canMakeMove(rowIndex, colIndex)}
                  willBeRemoved={nextToRemoveCell === `${rowIndex}-${colIndex}`}
                  onClick={() => makeMove(rowIndex, colIndex)}
                  whileHover={{ scale: canMakeMove(rowIndex, colIndex) ? 1.05 : 1 }}
                  whileTap={{ scale: canMakeMove(rowIndex, colIndex) ? 0.95 : 1 }}
                >
                  {cell && (
                    <Symbol
                      symbol={cell}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: disappearingCells.has(`${rowIndex}-${colIndex}`) ? 0 : 1, 
                        rotate: 0,
                        opacity: disappearingCells.has(`${rowIndex}-${colIndex}`) ? 0 : 1
                      }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        duration: disappearingCells.has(`${rowIndex}-${colIndex}`) ? 0.5 : 0.3
                      }}
                    >
                      {cell}
                    </Symbol>
                  )}
                </Cell>
              ))
            )}
          </Board>
        </BoardContainer>

        {/* Игровой чат */}
        <GameChat 
          gameRoomId={gameRoom?.id} 
          title="🎯 ЧАТ ИГРЫ"
        />
      </GameMainArea>

      <GameControls>
        {gameStats.gameState === 'finished' ? (
          <GameButton
            variant="secondary"
            onClick={showNewGameRequest}
            disabled={!!newGameRequest || balance < 10}
          >
            {balance < 10 
              ? '💸 Недостаточно SHELLS'
              : newGameRequest 
                ? '⏳ Запрос отправлен'
                : '🎮 Запросить новую игру'
            }
          </GameButton>
        ) : (
          <GameButton
            variant="secondary"
            onClick={resetGame}
            disabled={isLoading || gameRoom?.status !== 'playing'}
          >
            🔄 Сброс игры
          </GameButton>
        )}
      </GameControls>
    </GameContainer>
  );
} 