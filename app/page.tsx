'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import HoldersStats from './components/HoldersStats'

const HomeContainer = styled.div`
  min-height: 100vh;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`

const Hero = styled(motion.section)`
  text-align: center;
  padding: 4rem 0;
  position: relative;
  z-index: 2;
`

const HeroTitle = styled(motion.h1)`
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(2rem, 5vw, 4rem);
  color: var(--pepe-green);
  text-shadow: 
    0 0 20px var(--pepe-green),
    0 0 40px var(--pepe-green),
    0 0 60px var(--pepe-green);
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`

const HeroSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: var(--cyber-blue);
  margin-bottom: 3rem;
  text-shadow: 0 0 10px var(--cyber-blue);
`

const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto 4rem;
`

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.8) 0%, 
    rgba(0, 50, 100, 0.6) 50%, 
    rgba(0, 0, 0, 0.8) 100%);
  border: 3px solid var(--cyber-blue);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 40px rgba(0, 255, 255, 0.5);
    border-color: var(--neon-pink);
  }
`

const StatNumber = styled.div`
  font-family: 'Press Start 2P', cursive;
  font-size: 2rem;
  color: var(--electric-yellow);
  text-shadow: 0 0 20px var(--electric-yellow);
  margin-bottom: 1rem;
`

const StatLabel = styled.div`
  color: var(--cyber-blue);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const FeaturesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`

const FeatureCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--pepe-green);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  cursor: pointer;
  
  &:hover {
    border-color: var(--neon-pink);
    box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
  }
`

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 10px currentColor);
`

const FeatureTitle = styled.h3`
  font-family: 'Press Start 2P', cursive;
  font-size: 1rem;
  color: var(--cyber-blue);
  margin-bottom: 1rem;
  text-transform: uppercase;
`

const FeatureDesc = styled.p`
  color: var(--matrix-green);
  line-height: 1.6;
`

const CTAButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--pepe-green), var(--pepe-dark-green));
  border: 3px solid var(--cyber-blue);
  color: white;
  padding: 1rem 2rem;
  font-family: 'Press Start 2P', cursive;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 10px;
  text-transform: uppercase;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  margin: 2rem;
  
  &:hover {
    background: linear-gradient(45deg, var(--neon-pink), var(--electric-yellow));
    box-shadow: 0 0 40px rgba(255, 0, 255, 0.7);
  }
`

const FloatingPepe = styled(motion.div)`
  position: absolute;
  font-size: 4rem;
  z-index: 1;
  pointer-events: none;
`

// Кнопка чата в левом нижнем углу
const ChatButton = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 999;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
  border: 3px solid var(--cyber-blue);
  color: black;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  font-weight: bold;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(255, 0, 255, 0.7);
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
`

export default function Home() {
  const [totalPepes, setTotalPepes] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [dailyMessages, setDailyMessages] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)

  useEffect(() => {
    // Анимированные счетчики
    const animateCounter = (setter: any, target: number) => {
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.floor(current))
        }
      }, 30)
    }

    animateCounter(setTotalPepes, 13377)
    animateCounter(setOnlineUsers, 420)
    animateCounter(setDailyMessages, 6969)
    animateCounter(setGamesPlayed, 1337)
  }, [])

  const floatingPepes = Array.from({ length: 8 }, (_, i) => (
    <FloatingPepe
      key={i}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        rotate: [-5, 5, -5],
      }}
      transition={{
        duration: 3 + i * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.3,
      }}
      style={{
        top: `${20 + i * 10}%`,
        left: `${10 + (i % 4) * 20}%`,
      }}
    >
      🐸
    </FloatingPepe>
  ))

  return (
    <HomeContainer>
      {floatingPepes}
      
      <Hero>
        <HeroTitle
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
        >
          🐸 ДОБРО ПОЖАЛОВАТЬ В PEPE PORTAL 🐸
        </HeroTitle>
        
        <HeroSubtitle
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Самое крутое место для всех любителей Pepe! Играй, общайся, собирай!
        </HeroSubtitle>
        
        <Link href="/profile">
          <CTAButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            🚀 Начать приключение!
          </CTAButton>
        </Link>
      </Hero>

      <StatsGrid
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <StatCard whileHover={{ scale: 1.05 }}>
          <StatNumber>{totalPepes.toLocaleString()}</StatNumber>
          <StatLabel>🐸 Всего Pepe</StatLabel>
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.05 }}>
          <StatNumber>{onlineUsers}</StatNumber>
          <StatLabel>👥 Онлайн сейчас</StatLabel>
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.05 }}>
          <StatNumber>{dailyMessages.toLocaleString()}</StatNumber>
          <StatLabel>💬 Сообщений сегодня</StatLabel>
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.05 }}>
          <StatNumber>{gamesPlayed}</StatNumber>
          <StatLabel>🎮 Игр сыграно</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Статистика холдеров PEPE */}
      <HoldersStats />

      <FeaturesGrid
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <FeatureCard whileHover={{ scale: 1.05, rotate: 2 }}>
          <FeatureIcon>🎮</FeatureIcon>
          <FeatureTitle>Мини-игры</FeatureTitle>
          <FeatureDesc>
            Играй в крутые ретро-игры, зарабатывай очки и получай награды!
          </FeatureDesc>
        </FeatureCard>
        
        <FeatureCard whileHover={{ scale: 1.05, rotate: -2 }}>
          <FeatureIcon>👤</FeatureIcon>
          <FeatureTitle>Твой аватар</FeatureTitle>
          <FeatureDesc>
            Кастомизируй своего Pepe, собирай редкие предметы и хвастайся!
          </FeatureDesc>
        </FeatureCard>
        
        <FeatureCard whileHover={{ scale: 1.05, rotate: 1 }}>
          <FeatureIcon>💬</FeatureIcon>
          <FeatureTitle>Общение</FeatureTitle>
          <FeatureDesc>
            Болтай с другими участниками сообщества в реальном времени!
          </FeatureDesc>
        </FeatureCard>
        
        <FeatureCard whileHover={{ scale: 1.05, rotate: -1 }}>
          <FeatureIcon>🏆</FeatureIcon>
          <FeatureTitle>Достижения</FeatureTitle>
          <FeatureDesc>
            Выполняй задания, получай достижения и поднимайся в рейтинге!
          </FeatureDesc>
        </FeatureCard>
        
        <FeatureCard whileHover={{ scale: 1.05, rotate: 2 }}>
          <FeatureIcon>🛒</FeatureIcon>
          <FeatureTitle>Магазин</FeatureTitle>
          <FeatureDesc>
            Покупай крутые предметы для своего аватара за заработанные очки!
          </FeatureDesc>
        </FeatureCard>
        
        <FeatureCard whileHover={{ scale: 1.05, rotate: -2 }}>
          <FeatureIcon>🌟</FeatureIcon>
          <FeatureTitle>События</FeatureTitle>
          <FeatureDesc>
            Участвуй в специальных событиях и получай эксклюзивные награды!
          </FeatureDesc>
        </FeatureCard>
      </FeaturesGrid>

      {/* Кнопка чата */}
      <Link href="/chat">
        <ChatButton
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          💬
        </ChatButton>
      </Link>
    </HomeContainer>
  )
} 