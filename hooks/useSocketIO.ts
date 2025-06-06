'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";
import { io, Socket } from 'socket.io-client';

interface UseSocketIOOptions {
  roomId: string;
  onGameUpdate?: (data: any) => void;
  onPlayerJoined?: (data: any) => void;
  onPlayerLeft?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useSocketIO({
  roomId,
  onGameUpdate,
  onPlayerJoined,
  onPlayerLeft,
  onError
}: UseSocketIOOptions) {
  const account = useActiveAccount();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [playersOnline, setPlayersOnline] = useState<string[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!roomId || !account?.address || socketRef.current?.connected) return;

    setIsConnecting(true);

    // Создаем Socket.IO соединение
    const socket = io(process.env.NODE_ENV === 'production' 
      ? 'https://pepe-portal.railway.app' 
      : 'http://localhost:3000'
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket.IO connected');
      setIsConnected(true);
      setIsConnecting(false);

      // Присоединяемся к игровой комнате
      socket.emit('join-room', {
        roomId,
        playerAddress: account.address
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setIsConnected(false);
      setIsConnecting(false);
      onError?.('Ошибка подключения к серверу');
    });

    // Обработчики игровых событий
    socket.on('game-state', (data) => {
      console.log('🎮 Received game state:', data);
      setGameState(data);
    });

    socket.on('game-update', (data) => {
      console.log('🔄 Game updated:', data);
      setGameState(data.gameState);
      onGameUpdate?.(data);
    });

    socket.on('player-joined', (data) => {
      console.log('👋 Player joined:', data.playerAddress);
      onPlayerJoined?.(data);
    });

    socket.on('player-left', (data) => {
      console.log('👋 Player left:', data.playerAddress);
      onPlayerLeft?.(data);
    });

    socket.on('error', (data) => {
      console.error('🎮 Game error:', data.message);
      onError?.(data.message);
    });

    socket.on('pong', () => {
      // Keep-alive response
    });

    // Keep-alive ping каждые 30 секунд
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [roomId, account?.address, onGameUpdate, onPlayerJoined, onPlayerLeft, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, [roomId]);

  const sendGameAction = useCallback((action: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('game-action', {
        roomId,
        action: {
          ...action,
          player: account?.address
        }
      });
      return true;
    }
    return false;
  }, [roomId, account?.address]);

  // Автоматическое подключение
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    playersOnline,
    gameState,
    sendGameAction,
    connect,
    disconnect
  };
} 