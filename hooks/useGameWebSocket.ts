'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";

interface GameWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: any;
  playersOnline: string[];
  gameState: any;
}

interface UseGameWebSocketOptions {
  roomId: string;
  onGameUpdate?: (data: any) => void;
  onPlayerStatusChange?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useGameWebSocket({ 
  roomId, 
  onGameUpdate, 
  onPlayerStatusChange, 
  onError 
}: UseGameWebSocketOptions) {
  const account = useActiveAccount();
  const [state, setState] = useState<GameWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    playersOnline: [],
    gameState: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!roomId || !account?.address) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Создаем WebSocket соединение к серверу
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        }));
        
        reconnectAttempts.current = 0;

        // Присоединяемся к комнате
        wsRef.current?.send(JSON.stringify({
          type: 'join_room',
          roomId,
          playerAddress: account.address
        }));

        // Начинаем ping для keep-alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // ping каждые 30 секунд
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          setState(prev => ({ ...prev, lastMessage: data }));

          switch (data.type) {
            case 'room_joined':
              console.log('✅ Joined room:', data.roomId);
              setState(prev => ({ 
                ...prev, 
                gameState: data.data?.room,
                playersOnline: data.data?.playersOnline || []
              }));
              break;

            case 'game_update':
              console.log('🎮 Game update received');
              setState(prev => ({ 
                ...prev, 
                gameState: data.data?.room 
              }));
              onGameUpdate?.(data.data);
              break;

            case 'player_status':
              console.log('👤 Player status update');
              setState(prev => ({ 
                ...prev, 
                playersOnline: data.data?.playersOnline || []
              }));
              onPlayerStatusChange?.(data.data);
              break;

            case 'error':
              console.error('❌ WebSocket error:', data.error);
              setState(prev => ({ ...prev, error: data.error }));
              onError?.(data.error);
              break;

            case 'pong':
              // Keep-alive ответ
              break;

            default:
              console.log('📨 Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false 
        }));

        // Очищаем ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Автоматическое переподключение
        if (reconnectAttempts.current < maxReconnectAttempts && !event.wasClean) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            error: 'Connection failed after multiple attempts' 
          }));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          error: 'Connection error' 
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: 'Failed to establish connection' 
      }));
    }
  }, [roomId, account?.address, onGameUpdate, onPlayerStatusChange, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false 
    }));
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendGameAction = useCallback((action: any) => {
    return sendMessage({
      type: 'game_action',
      roomId,
      data: action
    });
  }, [sendMessage, roomId]);

  const requestSync = useCallback(() => {
    return sendMessage({
      type: 'sync_request',
      roomId
    });
  }, [sendMessage, roomId]);

  // Автоматическое подключение и отключение
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
    sendMessage,
    sendGameAction,
    requestSync,
    canReconnect: reconnectAttempts.current < maxReconnectAttempts
  };
} 