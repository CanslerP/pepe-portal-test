'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";

interface GameSSEState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  playersOnline: number;
  lastUpdate: any;
  gameState: any;
}

interface UseGameSSEOptions {
  roomId: string;
  onGameUpdate?: (data: any) => void;
  onPlayerStatusChange?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useGameSSE({ 
  roomId, 
  onGameUpdate, 
  onPlayerStatusChange, 
  onError 
}: UseGameSSEOptions) {
  const account = useActiveAccount();
  const [state, setState] = useState<GameSSEState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    playersOnline: 0,
    lastUpdate: null,
    gameState: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!roomId || !account?.address) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Создаем EventSource соединение
      const url = `/api/game-rooms/stream?roomId=${encodeURIComponent(roomId)}&playerAddress=${encodeURIComponent(account.address)}`;
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onopen = () => {
        console.log('🔌 SSE connected to room:', roomId);
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        }));
        reconnectAttempts.current = 0;
      };

      // Обработчики различных типов событий
      eventSourceRef.current.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('✅ Connected to game stream:', data.message);
      });

      eventSourceRef.current.addEventListener('game_state', (event) => {
        const data = JSON.parse(event.data);
        console.log('🎮 Initial game state received');
        setState(prev => ({ 
          ...prev, 
          gameState: data.room,
          lastUpdate: data 
        }));
        onGameUpdate?.(data);
      });

      eventSourceRef.current.addEventListener('game_update', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔄 Game update received');
        setState(prev => ({ 
          ...prev, 
          gameState: data.room || data.gameState,
          lastUpdate: data 
        }));
        onGameUpdate?.(data);
      });

      eventSourceRef.current.addEventListener('players_online', (event) => {
        const data = JSON.parse(event.data);
        console.log('👤 Players online update:', data.count);
        setState(prev => ({ 
          ...prev, 
          playersOnline: data.count 
        }));
        onPlayerStatusChange?.(data);
      });

      eventSourceRef.current.addEventListener('player_action', (event) => {
        const data = JSON.parse(event.data);
        console.log('🎯 Player action:', data.action);
        onPlayerStatusChange?.(data);
      });

      eventSourceRef.current.addEventListener('ping', (event) => {
        // Keep-alive ping - просто отвечаем в консоль
        // console.log('📡 Ping received');
      });

      eventSourceRef.current.onerror = (error) => {
        console.error('❌ SSE error:', error);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          error: 'Connection error'
        }));

        // Автоматическое переподключение
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`🔄 Reconnecting SSE in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setState(prev => ({ 
            ...prev, 
            error: 'Connection failed after multiple attempts' 
          }));
          onError?.('Connection failed after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: 'Failed to establish connection' 
      }));
      onError?.('Failed to establish connection');
    }
  }, [roomId, account?.address, onGameUpdate, onPlayerStatusChange, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false 
    }));
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 1000); // Задержка перед переподключением
  }, [disconnect, connect]);

  // Автоматическое подключение при изменении roomId или account
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    canReconnect: reconnectAttempts.current < maxReconnectAttempts
  };
} 