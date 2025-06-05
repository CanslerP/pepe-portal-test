'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const StatsContainer = styled(motion.div)`
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.9) 0%, 
    rgba(76, 175, 80, 0.2) 50%, 
    rgba(0, 0, 0, 0.9) 100%);
  border: 3px solid var(--pepe-green);
  border-radius: 20px;
  padding: 2rem;
  margin: 2rem 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(76, 175, 80, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, var(--pepe-green), var(--cyber-blue), var(--neon-pink), var(--pepe-green));
    border-radius: 22px;
    z-index: -1;
    animation: borderGlow 3s linear infinite;
  }
  
  @keyframes borderGlow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const StatsTitle = styled.h2`
  font-family: 'Press Start 2P', cursive;
  font-size: 1.5rem;
  color: var(--pepe-green);
  text-shadow: 0 0 20px var(--pepe-green);
  text-align: center;
  margin-bottom: 2rem;
  animation: pulse 2s infinite;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`

const StatCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--cyber-blue);
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--neon-pink);
    box-shadow: 0 0 25px rgba(255, 0, 255, 0.5);
    transform: translateY(-5px);
  }
`

const StatNumber = styled.div`
  font-family: 'Press Start 2P', cursive;
  font-size: 1.8rem;
  color: var(--electric-yellow);
  text-shadow: 0 0 15px var(--electric-yellow);
  margin-bottom: 0.5rem;
  animation: numberGlow 2s infinite alternate;
  
  @keyframes numberGlow {
    0% { text-shadow: 0 0 15px var(--electric-yellow); }
    100% { text-shadow: 0 0 25px var(--electric-yellow), 0 0 35px var(--electric-yellow); }
  }
`

const StatLabel = styled.div`
  color: var(--cyber-blue);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
`

const StatChange = styled.div<{ positive: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.positive ? 'var(--pepe-green)' : '#ff6666'};
  font-weight: bold;
  
  &::before {
    content: '${props => props.positive ? '📈' : '📉'}';
    margin-right: 0.5rem;
  }
`

const LastUpdate = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: var(--matrix-green);
  font-size: 0.8rem;
  opacity: 0.8;
`

const RefreshButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
  border: 2px solid var(--electric-yellow);
  color: white;
  padding: 0.5rem 1rem;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.7rem;
  cursor: pointer;
  border-radius: 10px;
  text-transform: uppercase;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  margin-top: 1rem;
  
  &:hover {
    box-shadow: 0 0 25px rgba(255, 0, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

interface HoldersData {
  date: string
  holdersCount: number
  dailyChange?: number
  timestamp: number
}

export default function HoldersStats() {
  const [holdersData, setHoldersData] = useState<HoldersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHoldersData = async () => {
    try {
      const response = await fetch('/api/holders-data?action=latest')
      const result = await response.json()
      
      if (result.success) {
        setHoldersData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching holders data:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateHoldersData = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/update-holders', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        setHoldersData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to update data')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error updating holders data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHoldersData()
    
    // Обновляем данные каждые 5 минут
    const interval = setInterval(fetchHoldersData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU')
  }

  if (loading) {
    return (
      <StatsContainer
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <StatsTitle>📊 Загрузка статистики PEPE...</StatsTitle>
      </StatsContainer>
    )
  }

  if (error || !holdersData) {
    return (
      <StatsContainer
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <StatsTitle>❌ Ошибка загрузки данных</StatsTitle>
        <div style={{ textAlign: 'center', color: 'var(--matrix-green)', marginTop: '1rem' }}>
          {error || 'Нет данных о холдерах'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <RefreshButton
            onClick={updateHoldersData}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {refreshing ? '🔄 Обновление...' : '🔄 Попробовать снова'}
          </RefreshButton>
        </div>
      </StatsContainer>
    )
  }

  return (
    <StatsContainer
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <StatsTitle>📊 СТАТИСТИКА PEPE ХОЛДЕРОВ</StatsTitle>
      
      <StatsGrid>
        <StatCard whileHover={{ scale: 1.05 }}>
          <StatNumber>{formatNumber(holdersData.holdersCount)}</StatNumber>
          <StatLabel>🐸 Всего холдеров</StatLabel>
          {holdersData.dailyChange !== undefined && (
            <StatChange positive={holdersData.dailyChange >= 0}>
              {holdersData.dailyChange >= 0 ? '+' : ''}{formatNumber(holdersData.dailyChange)} за день
            </StatChange>
          )}
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.05 }}>
          <StatNumber>{holdersData.date}</StatNumber>
          <StatLabel>📅 Дата данных</StatLabel>
        </StatCard>
      </StatsGrid>
      
      <div style={{ textAlign: 'center' }}>
        <RefreshButton
          onClick={updateHoldersData}
          disabled={refreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {refreshing ? '🔄 Обновление...' : '🔄 Обновить данные'}
        </RefreshButton>
      </div>
      
      <LastUpdate>
        Последнее обновление: {formatDate(holdersData.timestamp)}
      </LastUpdate>
    </StatsContainer>
  )
} 