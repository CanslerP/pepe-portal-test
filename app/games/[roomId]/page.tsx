'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GoGame from '../../components/games/GoGame';
import TicTacToeGame from '../../components/games/TicTacToeGame';
import { usePepeShells } from '@/hooks/usePepeShells';
import { useActiveAccount } from "thirdweb/react";

const GamesContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%);
  padding: clamp(100px, 15vh, 120px) clamp(10px, 3vw, 20px) 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%);
  }

  @media (max-width: 768px) {
    padding: 90px 15px 30px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  
  @media (max-width: 1440px) {
    max-width: 95%;
  }
`;

const BackButton = styled.button`
  background: rgba(255, 0, 255, 0.2);
  border: 1px solid #ff00ff;
  border-radius: 8px;
  color: #ff00ff;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 10px 20px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 0, 255, 0.3);
    box-shadow: 0 0 10px #ff00ff;
  }
`;

const GameArea = styled(motion.div)`
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ffff;
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(10px);
`;

const LoadingMessage = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  color: #00ffff;
  text-align: center;
  text-shadow: 0 0 10px #00ffff;
  padding: 40px;
`;

const ErrorMessage = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  color: #ff0000;
  text-align: center;
  text-shadow: 0 0 10px #ff0000;
  padding: 40px;
`;

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
  gameState?: any;
}

interface GamePageProps {
  params: {
    roomId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const account = useActiveAccount();
  const { refreshBalance } = usePepeShells();

  // Загружаем данные игровой комнаты
  useEffect(() => {
    const loadGameRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Loading game room with ID:', params.roomId);
        const apiUrl = `/api/game-rooms/room?id=${params.roomId}`;
        console.log('🌐 API URL:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        const data = await response.json();
        console.log('📊 Response data:', data);

        if (data.success && data.room) {
          // Преобразуем даты
          const room = {
            ...data.room,
            createdAt: new Date(data.room.createdAt),
            updatedAt: data.room.updatedAt ? new Date(data.room.updatedAt) : undefined,
          };
          console.log('✅ Game room loaded successfully:', room);
          setGameRoom(room);
        } else {
          console.error('❌ Game room not found:', data);
          setError(data.error || 'Игровая комната не найдена');
        }
      } catch (err) {
        console.error('💥 Error loading game room:', err);
        setError('Ошибка загрузки игровой комнаты');
      } finally {
        setLoading(false);
      }
    };

    if (params.roomId) {
      console.log('🚀 Starting to load game room with params:', params);
      loadGameRoom();
    } else {
      console.error('❌ No roomId in params:', params);
      setError('ID игровой комнаты не найден в URL');
    }
  }, [params.roomId]);

  // Автоматическое обновление данных игры
  useEffect(() => {
    if (!gameRoom) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/game-rooms/room?id=${params.roomId}`);
        const data = await response.json();

        if (data.success && data.room) {
          const updatedRoom = {
            ...data.room,
            createdAt: new Date(data.room.createdAt),
            updatedAt: data.room.updatedAt ? new Date(data.room.updatedAt) : undefined,
          };
          
          // Проверяем, завершилась ли игра
          if (gameRoom.status !== 'finished' && updatedRoom.status === 'finished') {
            console.log('Game finished detected, refreshing balance...');
            refreshBalance();
          }
          
          setGameRoom(updatedRoom);
        }
      } catch (err) {
        console.error('Error updating game room:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameRoom, params.roomId, refreshBalance]);

  const handleBackToLobby = () => {
    router.push('/games');
  };

  if (loading) {
    return (
      <GamesContainer>
        <ContentWrapper>
          <BackButton onClick={handleBackToLobby}>
            ← Назад к лобби
          </BackButton>
          <GameArea
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingMessage>Загрузка игры...</LoadingMessage>
          </GameArea>
        </ContentWrapper>
      </GamesContainer>
    );
  }

  if (error || !gameRoom) {
    return (
      <GamesContainer>
        <ContentWrapper>
          <BackButton onClick={handleBackToLobby}>
            ← Назад к лобби
          </BackButton>
          <GameArea
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ErrorMessage>{error || 'Игра не найдена'}</ErrorMessage>
          </GameArea>
        </ContentWrapper>
      </GamesContainer>
    );
  }

  return (
    <GamesContainer>
      <ContentWrapper>
        <BackButton onClick={handleBackToLobby}>
          ← Назад к лобби
        </BackButton>
        <GameArea
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {gameRoom.gameType === 'tictactoe' ? (
            <TicTacToeGame gameRoom={gameRoom} />
          ) : (
            <GoGame gameRoom={gameRoom} />
          )}
        </GameArea>
      </ContentWrapper>
    </GamesContainer>
  );
} 