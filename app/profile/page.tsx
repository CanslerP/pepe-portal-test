'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useActiveAccount } from "thirdweb/react"
import { usePepeShells } from '@/hooks/usePepeShells'

const ProfileContainer = styled.div`
  min-height: 100vh;
  padding: clamp(100px, 15vh, 120px) clamp(1rem, 3vw, 2rem) 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%);
  position: relative;

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
    pointer-events: none;
  }

  @media (max-width: 1440px) {
    max-width: 95%;
  }
`

const ProfileHeader = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }
`

const AvatarSection = styled(motion.div)`
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.8) 0%, 
    rgba(76, 175, 80, 0.3) 50%, 
    rgba(0, 0, 0, 0.8) 100%);
  border: 3px solid var(--pepe-green);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(76, 175, 80, 0.4);
`

const PepeAvatar = styled(motion.div)`
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, var(--pepe-green), var(--pepe-dark-green));
  border: 5px solid var(--cyber-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8rem;
  margin: 0 auto 2rem;
  box-shadow: 
    0 0 50px rgba(0, 255, 255, 0.5),
    inset 0 0 30px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
`

const UserInfo = styled(motion.div)`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--cyber-blue);
  border-radius: 15px;
  padding: 2rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
`

const Username = styled.h1`
  font-family: 'Press Start 2P', cursive;
  font-size: 2rem;
  color: var(--cyber-blue);
  text-shadow: 0 0 20px var(--cyber-blue);
  margin-bottom: 1rem;
  animation: neonFlicker 2s infinite alternate;
`

const UserLevel = styled.div`
  background: linear-gradient(45deg, var(--electric-yellow), var(--neon-pink));
  border-radius: 25px;
  padding: 0.5rem 1.5rem;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.8rem;
  color: black;
  display: inline-block;
  margin-bottom: 2rem;
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`

const StatItem = styled(motion.div)`
  background: rgba(0, 50, 100, 0.3);
  border: 1px solid var(--cyber-blue);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  
  &:hover {
    border-color: var(--neon-pink);
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
  }
`

const StatValue = styled.div`
  font-family: 'Press Start 2P', cursive;
  font-size: 1.5rem;
  color: var(--electric-yellow);
  text-shadow: 0 0 10px var(--electric-yellow);
  margin-bottom: 0.5rem;
`

const StatLabel = styled.div`
  color: var(--cyber-blue);
  font-size: 0.8rem;
  text-transform: uppercase;
`

const TabContainer = styled.div`
  display: flex;
  gap: clamp(0.5rem, 2vw, 1rem);
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--cyber-blue);
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
    justify-content: space-around;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
  }
`

const Tab = styled(motion.button)<{ active: boolean }>`
  background: ${props => props.active 
    ? 'linear-gradient(45deg, var(--pepe-green), var(--pepe-dark-green))' 
    : 'transparent'};
  border: 2px solid ${props => props.active ? 'var(--cyber-blue)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--cyber-blue)'};
  padding: clamp(0.7rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem);
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.6rem, 1.5vw, 0.7rem);
  cursor: pointer;
  border-radius: 10px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 0 20px rgba(0, 255, 255, 0.5)' : 'none'};
  white-space: nowrap;
  
  &:hover {
    border-color: var(--neon-pink);
    color: var(--neon-pink);
  }

  @media (max-width: 600px) {
    width: 100%;
    max-width: 200px;
    padding: 0.8rem 1rem;
  }
`

const ContentSection = styled(motion.div)`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--cyber-blue);
  border-radius: 15px;
  padding: 2rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  min-height: 400px;
`

const CustomizationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`

const AccessoryItem = styled(motion.div)<{ equipped: boolean }>`
  background: ${props => props.equipped 
    ? 'linear-gradient(45deg, var(--neon-pink), var(--electric-yellow))' 
    : 'rgba(0, 50, 100, 0.3)'};
  border: 2px solid ${props => props.equipped ? 'var(--electric-yellow)' : 'var(--cyber-blue)'};
  border-radius: 15px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  font-size: 2rem;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
  }
`

const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`

// Новые компоненты для настроек профиля
const SettingsSection = styled.div`
  margin-bottom: 2rem;
`

const SectionTitle = styled.h3`
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.8rem, 2vw, 1rem);
  color: var(--cyber-blue);
  margin-bottom: 1rem;
`

const NicknameForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`

const Input = styled.input`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--cyber-blue);
  border-radius: 8px;
  color: white;
  padding: 0.7rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  flex: 1;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: var(--neon-pink);
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const Button = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.variant) {
      case 'secondary': return 'rgba(255, 255, 0, 0.2)';
      case 'danger': return 'rgba(255, 0, 0, 0.2)';
      default: return 'linear-gradient(45deg, var(--pepe-green), var(--cyber-blue))';
    }
  }};
  border: 2px solid ${props => {
    switch (props.variant) {
      case 'secondary': return 'var(--electric-yellow)';
      case 'danger': return '#ff4444';
      default: return 'var(--cyber-blue)';
    }
  }};
  border-radius: 8px;
  color: ${props => props.variant === 'primary' ? 'white' : 
    props.variant === 'danger' ? '#ff6666' : 'var(--electric-yellow)'};
  padding: 0.7rem 1.5rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 15px ${props => {
      switch (props.variant) {
        case 'secondary': return 'rgba(255, 255, 0, 0.5)';
        case 'danger': return 'rgba(255, 0, 0, 0.5)';
        default: return 'rgba(0, 255, 255, 0.5)';
      }
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const SocialConnection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--cyber-blue);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`

const SocialInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`

const SocialIcon = styled.span`
  font-size: 1.5rem;
`

const SocialDetails = styled.div`
  color: white;
  font-family: 'Orbitron', monospace;
`

const SocialForm = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
  }
`

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid #ff4444;
  border-radius: 8px;
  color: #ff6666;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  text-align: center;
`

const SuccessMessage = styled.div`
  background: rgba(0, 255, 0, 0.2);
  border: 1px solid #44ff44;
  border-radius: 8px;
  color: #66ff66;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  text-align: center;
`

const AchievementCard = styled(motion.div)<{ unlocked: boolean }>`
  background: ${props => props.unlocked 
    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2))' 
    : 'rgba(0, 0, 0, 0.5)'};
  border: 2px solid ${props => props.unlocked ? 'var(--electric-yellow)' : '#333'};
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  opacity: ${props => props.unlocked ? 1 : 0.5};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.unlocked 
      ? '0 10px 30px rgba(255, 215, 0, 0.3)' 
      : '0 10px 30px rgba(0, 0, 0, 0.5)'};
  }
`

export default function Profile() {
  const [activeTab, setActiveTab] = useState('settings')
  const [equippedAccessories, setEquippedAccessories] = useState<string[]>([])
  
  // Состояние для форм
  const [nicknameInput, setNicknameInput] = useState('')
  const [twitterInput, setTwitterInput] = useState('')
  const [telegramInput, setTelegramInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const account = useActiveAccount()
  const { balance } = usePepeShells()
  const { 
    profile, 
    isLoading, 
    error, 
    updateNickname, 
    checkNicknameAvailability,
    connectSocial, 
    disconnectSocial, 
    updateCustomization 
  } = useUserProfile()

  const accessories = [
    { id: 'hat1', emoji: '🎩', name: 'Цилиндр' },
    { id: 'hat2', emoji: '👑', name: 'Корона' },
    { id: 'glasses1', emoji: '🕶️', name: 'Очки' },
    { id: 'glasses2', emoji: '🤓', name: 'Умные очки' },
    { id: 'chain', emoji: '📿', name: 'Цепь' },
    { id: 'bowtie', emoji: '🎀', name: 'Бабочка' },
  ]

  const achievements = [
    { id: 1, name: 'Первые шаги', desc: 'Создать аккаунт', emoji: '👶', unlocked: true },
    { id: 2, name: 'Болтун', desc: 'Отправить 100 сообщений', emoji: '💬', unlocked: true },
    { id: 3, name: 'Игрок', desc: 'Сыграть в 10 игр', emoji: '🎮', unlocked: true },
    { id: 4, name: 'Коллекционер', desc: 'Собрать 50 предметов', emoji: '🎒', unlocked: false },
    { id: 5, name: 'Легенда', desc: 'Достичь уровня 100', emoji: '🏆', unlocked: false },
    { id: 6, name: 'Миллионер', desc: 'Накопить 1М очков', emoji: '💰', unlocked: false },
  ]

  // Обновляем equipped accessories из профиля
  useEffect(() => {
    if (profile?.customization.equippedAccessories) {
      setEquippedAccessories(profile.customization.equippedAccessories)
    }
  }, [profile])

  // Очистка сообщений через 5 секунд
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const toggleAccessory = async (accessoryId: string) => {
    const newEquipped = equippedAccessories.includes(accessoryId) 
      ? equippedAccessories.filter(id => id !== accessoryId)
      : [...equippedAccessories, accessoryId]
    
    setEquippedAccessories(newEquipped)
    
    const success = await updateCustomization({
      equippedAccessories: newEquipped
    })
    
    if (success) {
      setMessage({ type: 'success', text: 'Customization updated!' })
    } else {
      setMessage({ type: 'error', text: 'Failed to update customization' })
      // Откатываем изменения
      setEquippedAccessories(equippedAccessories)
    }
  }

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nicknameInput.trim()) return

    const available = await checkNicknameAvailability(nicknameInput.trim())
    if (!available) {
      setMessage({ type: 'error', text: 'Nickname is already taken' })
      return
    }

    const success = await updateNickname(nicknameInput.trim())
    if (success) {
      setMessage({ type: 'success', text: 'Nickname updated successfully!' })
      setNicknameInput('')
    } else {
      setMessage({ type: 'error', text: error || 'Failed to update nickname' })
    }
  }

  const handleTwitterConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twitterInput.trim()) return

    const success = await connectSocial('twitter', twitterInput.trim())
    if (success) {
      setMessage({ type: 'success', text: 'Twitter connected successfully!' })
      setTwitterInput('')
    } else {
      setMessage({ type: 'error', text: error || 'Failed to connect Twitter' })
    }
  }

  const handleTelegramConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramInput.trim()) return

    const success = await connectSocial('telegram', telegramInput.trim())
    if (success) {
      setMessage({ type: 'success', text: 'Telegram connected successfully!' })
      setTelegramInput('')
    } else {
      setMessage({ type: 'error', text: error || 'Failed to connect Telegram' })
    }
  }

  const handleDisconnectSocial = async (platform: 'twitter' | 'telegram') => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform}?`)) return

    const success = await disconnectSocial(platform)
    if (success) {
      setMessage({ type: 'success', text: `${platform} disconnected successfully!` })
    } else {
      setMessage({ type: 'error', text: error || `Failed to disconnect ${platform}` })
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div>
            <h2 style={{ color: 'var(--cyber-blue)', marginBottom: '2rem', fontFamily: 'Press Start 2P', fontSize: 'clamp(0.8rem, 2vw, 1.2rem)' }}>
              ⚙️ НАСТРОЙКИ ПРОФИЛЯ
            </h2>
            
            {/* Messages */}
            {message && (
              message.type === 'error' 
                ? <ErrorMessage>{message.text}</ErrorMessage>
                : <SuccessMessage>{message.text}</SuccessMessage>
            )}
            
            {/* Nickname Settings */}
            <SettingsSection>
              <SectionTitle>📝 Никнейм</SectionTitle>
              <p style={{ color: 'var(--matrix-green)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                Текущий никнейм: <strong>{profile?.nickname || 'Loading...'}</strong>
              </p>
              <NicknameForm onSubmit={handleNicknameSubmit}>
                <Input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="Новый никнейм"
                  maxLength={20}
                  minLength={2}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !nicknameInput.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? '...' : 'Обновить'}
                </Button>
              </NicknameForm>
            </SettingsSection>

            {/* Social Connections */}
            <SettingsSection>
              <SectionTitle>🔗 Социальные сети</SectionTitle>
              
              {/* Twitter */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Twitter</h4>
                {profile?.socialConnections.twitter ? (
                  <SocialConnection>
                    <SocialInfo>
                      <SocialIcon>🐦</SocialIcon>
                      <SocialDetails>
                        @{profile.socialConnections.twitter.username}
                        {profile.socialConnections.twitter.verified && <span style={{ color: 'var(--pepe-green)' }}> ✓</span>}
                      </SocialDetails>
                    </SocialInfo>
                    <Button
                      variant="danger"
                      onClick={() => handleDisconnectSocial('twitter')}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Отключить
                    </Button>
                  </SocialConnection>
                ) : (
                  <SocialForm onSubmit={handleTwitterConnect}>
                    <Input
                      type="text"
                      value={twitterInput}
                      onChange={(e) => setTwitterInput(e.target.value)}
                      placeholder="Twitter username (без @)"
                      style={{ flex: 1 }}
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !twitterInput.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Подключить
                    </Button>
                  </SocialForm>
                )}
              </div>

              {/* Telegram */}
              <div>
                <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Telegram</h4>
                {profile?.socialConnections.telegram ? (
                  <SocialConnection>
                    <SocialInfo>
                      <SocialIcon>📱</SocialIcon>
                      <SocialDetails>
                        @{profile.socialConnections.telegram.username}
                        {profile.socialConnections.telegram.verified && <span style={{ color: 'var(--pepe-green)' }}> ✓</span>}
                      </SocialDetails>
                    </SocialInfo>
                    <Button
                      variant="danger"
                      onClick={() => handleDisconnectSocial('telegram')}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Отключить
                    </Button>
                  </SocialConnection>
                ) : (
                  <SocialForm onSubmit={handleTelegramConnect}>
                    <Input
                      type="text"
                      value={telegramInput}
                      onChange={(e) => setTelegramInput(e.target.value)}
                      placeholder="Telegram username (без @)"
                      style={{ flex: 1 }}
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !telegramInput.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Подключить
                    </Button>
                  </SocialForm>
                )}
              </div>
            </SettingsSection>
          </div>
        )

      case 'customization':
        return (
          <div>
            <h2 style={{ color: 'var(--cyber-blue)', marginBottom: '2rem', fontFamily: 'Press Start 2P', fontSize: 'clamp(0.8rem, 2vw, 1.2rem)' }}>
              🎨 КАСТОМИЗАЦИЯ PEPE
            </h2>
            <CustomizationGrid>
              {accessories.map(accessory => (
                <AccessoryItem
                  key={accessory.id}
                  equipped={equippedAccessories.includes(accessory.id)}
                  onClick={() => toggleAccessory(accessory.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {accessory.emoji}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--cyber-blue)' }}>
                    {accessory.name}
                  </div>
                </AccessoryItem>
              ))}
            </CustomizationGrid>
          </div>
        )
      
      case 'achievements':
        return (
          <div>
            <h2 style={{ color: 'var(--cyber-blue)', marginBottom: '2rem', fontFamily: 'Press Start 2P', fontSize: 'clamp(0.8rem, 2vw, 1.2rem)' }}>
              🏆 ДОСТИЖЕНИЯ
            </h2>
            <AchievementGrid>
              {achievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  unlocked={profile?.stats.achievements.includes(achievement.id.toString()) || achievement.unlocked}
                  whileHover={{ y: -5 }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {achievement.emoji}
                  </div>
                  <h3 style={{ 
                    color: (profile?.stats.achievements.includes(achievement.id.toString()) || achievement.unlocked) ? 'var(--electric-yellow)' : '#666',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem',
                    fontFamily: 'Press Start 2P'
                  }}>
                    {achievement.name}
                  </h3>
                  <p style={{ 
                    color: (profile?.stats.achievements.includes(achievement.id.toString()) || achievement.unlocked) ? 'var(--cyber-blue)' : '#444',
                    fontSize: '0.7rem'
                  }}>
                    {achievement.desc}
                  </p>
                </AchievementCard>
              ))}
            </AchievementGrid>
          </div>
        )
      
      default:
        return <div>Выбери вкладку</div>
    }
  }

  return (
    <ProfileContainer>
      <ProfileHeader
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <AvatarSection>
          <PepeAvatar
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              🐸
              {equippedAccessories.includes('hat1') && (
                <div style={{ position: 'absolute', top: '-40px', left: '10px', fontSize: '3rem' }}>🎩</div>
              )}
              {equippedAccessories.includes('hat2') && (
                <div style={{ position: 'absolute', top: '-40px', left: '10px', fontSize: '3rem' }}>👑</div>
              )}
              {equippedAccessories.includes('glasses1') && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '2rem' }}>🕶️</div>
              )}
              {equippedAccessories.includes('glasses2') && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '2rem' }}>🤓</div>
              )}
            </div>
          </PepeAvatar>
          
          <motion.button 
            className="retro-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ margin: '1rem 0' }}
          >
            📸 Изменить аватар
          </motion.button>
        </AvatarSection>

        <UserInfo>
          <Username className="neon-text">
            {profile?.nickname || (account?.address ? 'Loading...' : 'Connect Wallet')}
          </Username>
          <UserLevel>🌟 PEPE SHELLS: {balance}</UserLevel>
          
          <StatsGrid>
            <StatItem whileHover={{ scale: 1.05 }}>
              <StatValue>{profile?.stats.pepeShellsEarned || 0}</StatValue>
              <StatLabel>💰 Заработано</StatLabel>
            </StatItem>
            <StatItem whileHover={{ scale: 1.05 }}>
              <StatValue>{profile?.stats.gamesPlayed || 0}</StatValue>
              <StatLabel>🎮 Игр сыграно</StatLabel>
            </StatItem>
            <StatItem whileHover={{ scale: 1.05 }}>
              <StatValue>{profile?.stats.totalMessages || 0}</StatValue>
              <StatLabel>💬 Сообщений</StatLabel>
            </StatItem>
            <StatItem whileHover={{ scale: 1.05 }}>
              <StatValue>{profile?.stats.achievements.length || 0}</StatValue>
              <StatLabel>🏆 Достижений</StatLabel>
            </StatItem>
          </StatsGrid>
          
          <div style={{ color: 'var(--matrix-green)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            📍 Участник с: <strong>{profile?.joinedAt ? profile.joinedAt.toLocaleDateString('ru') : 'N/A'}</strong><br/>
            🎯 Статус: <strong>
              {profile?.socialConnections.twitter || profile?.socialConnections.telegram 
                ? 'Verified Member' 
                : 'Member'}
            </strong><br/>
            🔗 Социальные сети: <strong>
              {[
                profile?.socialConnections.twitter && '🐦 Twitter',
                profile?.socialConnections.telegram && '📱 Telegram'
              ].filter(Boolean).join(', ') || 'Не подключены'}
            </strong>
          </div>
        </UserInfo>
      </ProfileHeader>

      <TabContainer>
        <Tab 
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          whileHover={{ scale: 1.05 }}
        >
          ⚙️ Настройки
        </Tab>
        <Tab 
          active={activeTab === 'customization'}
          onClick={() => setActiveTab('customization')}
          whileHover={{ scale: 1.05 }}
        >
          🎨 Кастомизация
        </Tab>
        <Tab 
          active={activeTab === 'achievements'}
          onClick={() => setActiveTab('achievements')}
          whileHover={{ scale: 1.05 }}
        >
          🏆 Достижения
        </Tab>
      </TabContainer>

      <ContentSection
        key={activeTab}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderTabContent()}
      </ContentSection>
    </ProfileContainer>
  )
} 