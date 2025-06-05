import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";

// Типы для игровых комнат
interface ChatMessage {
  id: string;
  player: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

interface GameState {
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
}

export interface GameRoom {
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
  gameState?: GameState;
}

export function useGameRooms() {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();

  // Загрузка игр с сервера
  const loadGameRooms = useCallback(async () => {
    try {
      console.log('Loading game rooms from server...');
      const response = await fetch('/api/game-rooms');
      const data = await response.json();
      
      if (data.success) {
        // Преобразуем строки дат обратно в объекты Date
        const roomsWithDates = data.rooms.map((room: any) => ({
          ...room,
          createdAt: new Date(room.createdAt),
          updatedAt: room.updatedAt ? new Date(room.updatedAt) : undefined,
          gameState: room.gameState ? {
            ...room.gameState,
            moves: room.gameState.moves?.map((move: any) => ({
              ...move,
              timestamp: new Date(move.timestamp)
            })) || [],
            messages: room.gameState.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })) || []
          } : undefined
        }));
        
        console.log('Loaded from server:', roomsWithDates.length, 'game rooms');
        setGameRooms(roomsWithDates);
      } else {
        console.error('Failed to load game rooms:', data.error);
        setGameRooms([]);
      }
    } catch (error) {
      console.error('Error loading game rooms:', error);
      setGameRooms([]);
    }
  }, []);



  // Загрузка при инициализации
  useEffect(() => {
    loadGameRooms();
  }, [loadGameRooms]);

  // Обновление происходит по требованию через refreshRooms из родительского компонента

  // Создание новой игры через API
  const createGame = useCallback(async (gameData: Omit<GameRoom, 'id' | 'createdAt'>) => {
    if (!account?.address) return null;

    setIsLoading(true);
    
    try {
      console.log('Creating game via API:', gameData);
      const response = await fetch('/api/game-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Game created successfully:', data.room.id);
        // Обновляем локальный список игр
        await loadGameRooms();
        setIsLoading(false);
        return data.room;
      } else {
        console.error('Failed to create game:', data.error);
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setIsLoading(false);
      return null;
    }
  }, [account?.address, loadGameRooms]);

  // Присоединение к игре через API
  const joinGame = useCallback(async (roomId: string, opponentName: string) => {
    if (!account?.address) return false;

    setIsLoading(true);
    
    try {
      console.log('Joining game via API:', roomId);
      const response = await fetch('/api/game-rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          action: 'join',
          playerAddress: account.address,
          playerName: opponentName,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Joined game successfully:', roomId);
        // Обновляем локальный список игр
        await loadGameRooms();
        setIsLoading(false);
        return true;
      } else {
        console.error('Failed to join game:', data.error);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setIsLoading(false);
      return false;
    }
  }, [account?.address, loadGameRooms]);

  // Обновление статуса игры через API
  const updateGameStatus = useCallback(async (roomId: string, status: GameRoom['status'], winner?: string) => {
    try {
      console.log('Updating game status via API:', roomId, status);
      const response = await fetch('/api/game-rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          action: 'updateStatus',
          status,
          winner,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Updated game status successfully:', roomId);
        // Обновляем локальный список игр
        await loadGameRooms();
      } else {
        console.error('Failed to update game status:', data.error);
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  }, [loadGameRooms]);



  // Получение всех активных игр (ожидающих и играющих)
  const getAvailableGames = useCallback(() => {
    const filtered = gameRooms.filter(room => 
      room.status === 'waiting' || room.status === 'playing'
    );
    console.log('getAvailableGames:', filtered.length, 'games found');
    return filtered;
  }, [gameRooms]);

  // Получение игр, доступных для присоединения (только других игроков)
  const getJoinableGames = useCallback(() => {
    const filtered = gameRooms.filter(room => 
      room.status === 'waiting' && 
      room.creator !== account?.address
    );
    console.log('getJoinableGames:', filtered.length, 'games found for', account?.address);
    return filtered;
  }, [gameRooms, account?.address]);

  // Получение игр пользователя
  const getUserGames = useCallback(() => {
    const filtered = gameRooms.filter(room => 
      room.creator === account?.address || 
      room.opponent === account?.address
    );
    console.log('getUserGames:', filtered.length, 'games found for', account?.address);
    return filtered;
  }, [gameRooms, account?.address]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    gameRooms,
    isLoading,
    createGame,
    joinGame,
    updateGameStatus,
    getAvailableGames,
    getJoinableGames,
    getUserGames,
    refreshRooms: loadGameRooms,
    formatAddress
  };
} 