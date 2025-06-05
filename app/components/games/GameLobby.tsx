'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useActiveAccount } from "thirdweb/react";

import { type GameRoom } from '@/hooks/useGameRooms';

interface GameLobbyProps {
  onJoinGame: (roomId: string) => void;
  onCreateGame: (gameData: Omit<GameRoom, 'id' | 'createdAt'>) => void;
  onCancelGame?: (roomId: string) => void;
  availableGames: GameRoom[];
  userShells: number;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Стилизованные компоненты
const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 1000px;
`;

const LobbyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
`;

const ShellBalance = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border: 2px solid #00ffff;
  border-radius: 15px;
  padding: 10px 20px;
  font-family: 'Orbitron', monospace;
  font-weight: bold;
  color: #000;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
`;

const ShellIcon = styled.span`
  font-size: 1.2rem;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
`;

const CreateGameButton = styled(motion.button)`
  background: linear-gradient(45deg, #ff00ff, #00ffff);
  border: 2px solid #00ff00;
  border-radius: 15px;
  color: #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.9rem;
  padding: 15px 25px;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
  }
`;

const GamesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const GameRoomCard = styled(motion.div)<{ isOwn?: boolean }>`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${props => props.isOwn ? '#00ff00' : '#00ffff'};
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.isOwn ? '#00ff00' : '#ff00ff'};
    box-shadow: 0 0 20px ${props => props.isOwn ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 255, 0.3)'};
    transform: translateY(-5px);
  }
`;

const GameRoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const GameType = styled.h3`
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: #00ffff;
  text-shadow: 0 0 5px #00ffff;
  margin: 0;
`;

const GameStatus = styled.span<{ status: string }>`
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  padding: 5px 10px;
  border-radius: 8px;
  background: ${props => {
    switch (props.status) {
      case 'waiting': return 'rgba(255, 255, 0, 0.2)';
      case 'playing': return 'rgba(0, 255, 0, 0.2)';
      case 'finished': return 'rgba(255, 0, 0, 0.2)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'waiting': return '#ffff00';
      case 'playing': return '#00ff00';
      case 'finished': return '#ff0000';
      default: return '#ffffff';
    }
  }};
  border: 1px solid currentColor;
  text-transform: uppercase;
`;

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  color: #ffffff;
`;

const BetAmount = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #FFD700;
  font-weight: bold;
`;

const JoinButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  background: ${props => props.disabled 
    ? 'rgba(128, 128, 128, 0.3)' 
    : 'linear-gradient(45deg, #00ff00, #00ffff)'};
  border: 1px solid ${props => props.disabled ? '#666' : '#00ff00'};
  border-radius: 10px;
  color: ${props => props.disabled ? '#666' : '#000'};
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }
`;

const GameButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const CancelButton = styled.button`
  flex: 1;
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid #ff0000;
  border-radius: 10px;
  color: #ff0000;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;

  &:hover {
    background: rgba(255, 0, 0, 0.3);
    transform: scale(1.02);
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
`;

const CreateGameModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 3px solid #00ffff;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
`;

const ModalTitle = styled.h2`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #00ffff;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 0 0 10px #00ffff;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-family: 'Orbitron', monospace;
  color: #ffffff;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Select = styled.select`
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ffff;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 10px;

  &:focus {
    outline: none;
    box-shadow: 0 0 10px #00ffff;
  }
`;

const Input = styled.input`
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ffff;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 10px;

  &:focus {
    outline: none;
    box-shadow: 0 0 10px #00ffff;
  }

  &::placeholder {
    color: #666;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const ModalButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  background: ${props => props.variant === 'secondary' 
    ? 'rgba(255, 0, 0, 0.2)' 
    : 'linear-gradient(45deg, #ff00ff, #00ffff)'};
  border: 1px solid ${props => props.variant === 'secondary' ? '#ff0000' : 'transparent'};
  border-radius: 8px;
  color: ${props => props.variant === 'secondary' ? '#ff0000' : '#000'};
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;

  &:hover {
    transform: scale(1.05);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  font-family: 'Orbitron', monospace;
  color: #666;
  font-size: 1.1rem;
`;

export default function GameLobby({ onJoinGame, onCreateGame, onCancelGame, availableGames, userShells, onRefresh, isLoading }: GameLobbyProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<'go' | 'chess' | 'tictactoe'>('go');
  const [betAmount, setBetAmount] = useState(10);
  const account = useActiveAccount();

  const formatAddressLocal = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case 'go': return 'GO (Вейци)';
      case 'chess': return 'Шахматы';
      case 'tictactoe': return 'Крестики-нолики';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'Ожидание';
      case 'playing': return 'Играют';
      case 'finished': return 'Завершена';
      default: return status;
    }
  };

  const handleCreateGame = useCallback(() => {
    if (!account?.address) return;
    
    const gameData = {
      creator: account.address,
      creatorName: formatAddressLocal(account.address),
      betAmount,
      gameType: selectedGameType,
      status: 'waiting' as const
    };

    onCreateGame(gameData);
    setShowCreateModal(false);
    setBetAmount(10);
    setSelectedGameType('go');
  }, [account, betAmount, selectedGameType, onCreateGame]);

  const handleCancelGame = useCallback(async (roomId: string, betAmount: number) => {
    if (!account?.address || !onCancelGame) return;
    
    if (!window.confirm(`Вы уверены, что хотите отменить игру? Ставка ${betAmount} SHELLS будет возвращена.`)) {
      return;
    }
    
    onCancelGame(roomId);
  }, [account, onCancelGame]);

  const canCreateGame = account?.address && userShells >= betAmount;
  
  const canJoinGame = (game: GameRoom) => {
    if (!account?.address) return false;
    
    // Если это игра в ожидании и пользователь не создатель
    if (game.status === 'waiting' && game.creator !== account.address && userShells >= game.betAmount) {
      return true;
    }
    
    // Если это активная игра и пользователь участник
    if (game.status === 'playing' && isParticipant(game)) {
      return true;
    }
    
    // Если это завершенная игра - можно наблюдать
    if (game.status === 'finished') {
      return true;
    }
    
    return false;
  };

  const isOwnGame = (game: GameRoom) => {
    return game.creator === account?.address;
  };

  const isParticipant = (game: GameRoom) => {
    return account?.address && (
      game.creator === account.address || 
      game.opponent === account.address
    );
  };

  const getGameStatusText = (game: GameRoom) => {
    const isMyGame = isOwnGame(game);
    const amParticipant = isParticipant(game);
    
    switch (game.status) {
      case 'waiting':
        if (isMyGame) return 'Ожидание игрока';
        return 'Присоединиться';
        
      case 'playing':
        if (amParticipant) return 'Продолжить игру';
        return 'Наблюдать';
        
      case 'finished':
        return 'Просмотр';
        
      default:
        return game.status;
    }
  };

  const createTestGames = async () => {
    try {
      const response = await fetch('/api/game-rooms/test', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Обновляем список игр
        if (onRefresh) {
          onRefresh();
        }
        alert(data.message);
      } else {
        alert('Ошибка при создании тестовых игр: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating test games:', error);
      alert('Ошибка при создании тестовых игр');
    }
  };



  return (
    <LobbyContainer>
      <LobbyHeader>
        <ShellBalance>
          <ShellIcon>🐚</ShellIcon>
          <span>{userShells.toLocaleString()} PEPE SHELLS</span>
        </ShellBalance>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onRefresh && (
            <CreateGameButton
              onClick={onRefresh}
              disabled={isLoading}
              whileHover={{ scale: !isLoading ? 1.05 : 1 }}
              whileTap={{ scale: !isLoading ? 0.95 : 1 }}
              style={{ 
                background: isLoading 
                  ? 'rgba(0, 255, 255, 0.3)' 
                  : 'linear-gradient(45deg, #00ffff, #00ff00)' 
              }}
            >
              {isLoading ? '🔄 Обновление...' : '🔄 Обновить'}
            </CreateGameButton>
          )}
          
          <CreateGameButton
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateGame}
            whileHover={{ scale: canCreateGame ? 1.05 : 1 }}
            whileTap={{ scale: canCreateGame ? 0.95 : 1 }}
          >
            + Создать игру
          </CreateGameButton>

          <CreateGameButton
            onClick={createTestGames}
            style={{ 
              background: 'linear-gradient(45deg, #ffff00, #ff8800)',
              fontSize: '0.7rem'
            }}
          >
            🧪 Тест игры
          </CreateGameButton>


        </div>
      </LobbyHeader>

      {availableGames.length === 0 ? (
        <EmptyState>
          {isLoading ? (
            <>🔄 Загрузка игр...</>
          ) : (
            <>
              Пока нет доступных игр.<br />
              Создайте первую игру!
            </>
          )}
        </EmptyState>
      ) : (
        <GamesList>
          {availableGames.map((game) => {
            const ownGame = isOwnGame(game);
            return (
              <GameRoomCard
                key={game.id}
                isOwn={ownGame}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GameRoomHeader>
                  <GameType>{getGameTypeLabel(game.gameType)}</GameType>
                  <GameStatus status={game.status}>
                    {getStatusLabel(game.status)}
                    {ownGame && ' (Ваша игра)'}
                  </GameStatus>
                </GameRoomHeader>

                <GameInfo>
                  <InfoRow>
                    <span>Создатель:</span>
                    <span>{ownGame ? 'Вы' : game.creatorName}</span>
                  </InfoRow>
                  <InfoRow>
                    <span>Время:</span>
                    <span>{formatDate(game.createdAt)}</span>
                  </InfoRow>
                  {game.opponent && (
                    <InfoRow>
                      <span>Оппонент:</span>
                      <span>{game.opponentName || formatAddressLocal(game.opponent)}</span>
                    </InfoRow>
                  )}
                  <InfoRow>
                    <span>Ставка:</span>
                    <BetAmount>
                      <ShellIcon>🐚</ShellIcon>
                      <span>{game.betAmount}</span>
                    </BetAmount>
                  </InfoRow>
                </GameInfo>

                {ownGame && game.status === 'waiting' ? (
                  // Для собственных игр в ожидании показываем кнопки входа и отмены
                  <GameButtonsContainer>
                    <JoinButton
                      onClick={() => onJoinGame(game.id)}
                      style={{
                        background: 'linear-gradient(45deg, #00ff00, #00ffff)',
                        flex: 2
                      }}
                    >
                      Войти в игру
                    </JoinButton>
                    <CancelButton
                      onClick={() => handleCancelGame(game.id, game.betAmount)}
                    >
                      Отменить
                    </CancelButton>
                  </GameButtonsContainer>
                ) : (
                  // Для всех остальных случаев - обычная кнопка
                  <JoinButton
                    disabled={!canJoinGame(game)}
                    onClick={() => onJoinGame(game.id)}
                    style={{
                      background: !canJoinGame(game)
                        ? 'rgba(128, 128, 128, 0.3)'
                        : 'linear-gradient(45deg, #00ff00, #00ffff)'
                    }}
                  >
                    {getGameStatusText(game)}
                  </JoinButton>
                )}
              </GameRoomCard>
            );
          })}
        </GamesList>
      )}

      {showCreateModal && (
        <CreateGameModal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <ModalContent
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ModalTitle>Создать игру</ModalTitle>
            
            <FormGroup>
              <Label>Тип игры:</Label>
              <Select
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value as any)}
              >
                <option value="go">GO (Вейци)</option>
                <option value="chess">Шахматы (скоро)</option>
                <option value="tictactoe">Evolving Tic-Tac-Toe</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Ставка (PEPE SHELLS):</Label>
              <Input
                type="number"
                min="1"
                max={userShells}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Math.min(userShells, Number(e.target.value))))}
                placeholder="Введите сумму ставки"
              />
            </FormGroup>

            <ModalButtons>
              <ModalButton
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Отмена
              </ModalButton>
              <ModalButton
                onClick={handleCreateGame}
                disabled={!canCreateGame}
              >
                Создать
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </CreateGameModal>
      )}
    </LobbyContainer>
  );
} 