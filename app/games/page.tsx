'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GameLobby from '../components/games/GameLobby';
import { usePepeShells } from '@/hooks/usePepeShells';
import { useGameRooms, type GameRoom } from '@/hooks/useGameRooms';
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

const PageTitle = styled(motion.h1)`
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(2rem, 5vw, 4rem);
  color: #00ffff;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 
    0 0 10px #00ffff,
    0 0 20px #00ffff,
    0 0 40px #00ffff;
  
  background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`;

const SubTitle = styled(motion.p)`
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  color: #ff00ff;
  text-align: center;
  margin-bottom: 60px;
  text-shadow: 0 0 10px #ff00ff;
`;

const GamesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
`;

const GameCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ffff;
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ff00ff;
    box-shadow: 
      0 0 20px #ff00ff,
      inset 0 0 20px rgba(255, 0, 255, 0.1);
    transform: translateY(-5px);
  }
`;

const GameTitle = styled.h3`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #00ffff;
  margin-bottom: 15px;
  text-shadow: 0 0 5px #00ffff;
`;

const GameDescription = styled.p`
  font-family: 'Orbitron', monospace;
  color: #ffffff;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const GameStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlayersOnline = styled.span`
  font-family: 'Orbitron', monospace;
  color: #00ff00;
  font-size: 0.8rem;
  text-shadow: 0 0 5px #00ff00;
`;

const PlayButton = styled.button`
  background: linear-gradient(45deg, #ff00ff, #00ffff);
  border: none;
  border-radius: 8px;
  color: #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px #ff00ff;
  }
`;

const GameArea = styled(motion.div)`
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ffff;
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(10px);
  margin-top: 40px;
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

export default function GamesPage() {
  const router = useRouter();
  const { balance, deductShells, addShells, refreshBalance } = usePepeShells();
  const { 
    createGame, 
    joinGame, 
    getAvailableGames,
    getJoinableGames, 
    formatAddress,
    isLoading,
    refreshRooms,
    gameRooms  // Добавляем gameRooms для реактивности
  } = useGameRooms();
  const account = useActiveAccount();

  // Получаем актуальные игры, которые будут обновляться автоматически
  const availableGames = getAvailableGames();

  const handleCreateGame = async (gameData: Omit<GameRoom, 'id' | 'createdAt'>) => {
    if (!account?.address) return;

    // Списываем ставку
    const success = await deductShells(gameData.betAmount, `Creating ${gameData.gameType} game`);
    if (!success) {
      alert('Недостаточно PEPE SHELLS для создания игры!');
      return;
    }
    
    const newRoom = await createGame(gameData);
    if (newRoom) {
      // Обновляем состояние чтобы игра сразу отобразилась
      refreshRooms();
      alert('Игра успешно создана! Ожидайте присоединения другого игрока.');
    } else {
      // Если создание игры не удалось, возвращаем ставку
      await addShells(gameData.betAmount, 'Game creation failed - refund');
    }
  };

  const handleJoinGame = async (roomId: string) => {
    console.log('🎮 handleJoinGame called with roomId:', roomId);
    
    if (!account?.address) {
      console.error('❌ No account address');
      return;
    }

    console.log('👤 User account:', account.address);

    // Обновляем данные перед присоединением
    refreshRooms();
    
    // Ищем комнату среди всех доступных игр, а не только joinable
    const allGames = getAvailableGames();
    console.log('🎯 Available games:', allGames.length);
    const room = allGames.find(r => r.id === roomId);
    
    if (!room) {
      console.error('❌ Room not found in available games');
      alert('Эта игра больше не доступна!');
      return;
    }
    
    console.log('📋 Found room:', room);

    // Проверяем, является ли пользователь создателем игры
    const isCreator = room.creator === account.address;
    console.log('🏗️ Is creator:', isCreator);
    
    // Если не создатель, то проверяем доступность для присоединения и списываем ставку
    if (!isCreator) {
      const joinableGames = getJoinableGames();
      const joinableRoom = joinableGames.find(r => r.id === roomId);
      if (!joinableRoom) {
        console.error('❌ Room not joinable');
        alert('Эта игра больше не доступна для присоединения!');
        return;
      }

      console.log('💰 Deducting shells:', room.betAmount);
      // Списываем ставку только если присоединяемся, а не если это наша игра
      const success = await deductShells(room.betAmount, `Joining ${room.gameType} game vs ${room.creatorName}`);
      if (!success) {
        console.error('❌ Failed to deduct shells');
        alert('Недостаточно PEPE SHELLS для присоединения к игре!');
        return;
      }
      
      console.log('🤝 Joining game...');
      const joined = await joinGame(roomId, formatAddress(account.address));
      if (!joined) {
        console.error('❌ Failed to join game');
        // Если присоединение не удалось, возвращаем ставку
        await addShells(room.betAmount, 'Game join failed - refund');
        alert('Не удалось присоединиться к игре!');
        return;
      }
      console.log('✅ Successfully joined game');
    }
    
    // Перенаправляем на страницу игры
    const gameUrl = `/games/${roomId}`;
    console.log('🔄 Redirecting to:', gameUrl);
    router.push(gameUrl);
  };

  const handleCancelGame = async (roomId: string) => {
    if (!account?.address) return;

    try {
      const response = await fetch(`/api/game-rooms/room?id=${roomId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('Игра отменена, ставка возвращена!');
        // Обновляем список игр
        refreshRooms();
        // Обновляем баланс
        refreshBalance();
      } else {
        alert('Ошибка при отмене игры: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling game:', error);
      alert('Ошибка при отмене игры');
    }
  };

  return (
    <GamesContainer>
      <ContentWrapper>
        <PageTitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          CYBER GAMES LOBBY
        </PageTitle>
        
        <SubTitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Создавайте игры, делайте ставки и играйте за PEPE SHELLS 🐚
        </SubTitle>

        <GameLobby
          onJoinGame={handleJoinGame}
          onCreateGame={handleCreateGame}
          onCancelGame={handleCancelGame}
          availableGames={availableGames}
          userShells={balance}
          onRefresh={refreshRooms}
          isLoading={isLoading}
        />
      </ContentWrapper>
    </GamesContainer>
  );
} 