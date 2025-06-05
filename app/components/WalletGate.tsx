'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'
import { ConnectButton as ThirdwebConnectButton, useActiveAccount } from "thirdweb/react"
import { usePepeBalance } from '@/hooks/usePepeBalance'
import { useEffect, useState } from 'react'
import { client, supportedChains } from '@/lib/thirdweb-config'

const GateContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.95) 0%, 
    rgba(0, 50, 100, 0.9) 50%, 
    rgba(0, 0, 0, 0.95) 100%);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
`

const GateCard = styled(motion.div)`
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.9) 0%, 
    rgba(76, 175, 80, 0.2) 50%, 
    rgba(0, 0, 0, 0.9) 100%);
  border: 3px solid var(--cyber-blue);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink), var(--electric-yellow), var(--cyber-blue));
    border-radius: 22px;
    z-index: -1;
    animation: borderRotate 3s linear infinite;
  }
  
  @keyframes borderRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const Title = styled.h1`
  font-family: 'Press Start 2P', cursive;
  font-size: 1.5rem;
  color: var(--pepe-green);
  text-shadow: 0 0 20px var(--pepe-green);
  margin-bottom: 2rem;
  animation: pulse 2s infinite;
`

const PepeIcon = styled(motion.div)`
  font-size: 8rem;
  margin: 2rem 0;
  filter: drop-shadow(0 0 30px var(--pepe-green));
`

const Description = styled.p`
  color: var(--cyber-blue);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px var(--cyber-blue);
`

const ConnectButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--pepe-green), var(--pepe-dark-green));
  border: 3px solid var(--cyber-blue);
  color: white;
  padding: 1rem 2rem;
  font-family: 'Press Start 2P', cursive;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 15px;
  text-transform: uppercase;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  margin: 1rem;
  width: 100%;
  
  &:hover {
    background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
    box-shadow: 0 0 40px rgba(255, 0, 255, 0.7);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const BalanceInfo = styled(motion.div)`
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--electric-yellow);
  border-radius: 15px;
  padding: 1.5rem;
  margin: 2rem 0;
  backdrop-filter: blur(5px);
`

const BalanceValue = styled.div`
  font-family: 'Press Start 2P', cursive;
  font-size: 1.2rem;
  color: var(--electric-yellow);
  text-shadow: 0 0 15px var(--electric-yellow);
  margin-bottom: 0.5rem;
`

const BalanceLabel = styled.div`
  color: var(--cyber-blue);
  font-size: 0.9rem;
`

const ErrorMessage = styled(motion.div)`
  background: linear-gradient(45deg, rgba(255, 0, 0, 0.2), rgba(255, 100, 100, 0.2));
  border: 2px solid #ff4444;
  border-radius: 10px;
  padding: 1rem;
  color: #ff6666;
  font-size: 0.9rem;
  margin: 1rem 0;
`

const LoadingSpinner = styled(motion.div)`
  width: 50px;
  height: 50px;
  border: 3px solid var(--cyber-blue);
  border-top: 3px solid var(--neon-pink);
  border-radius: 50%;
  margin: 2rem auto;
`

interface WalletGateProps {
  children: React.ReactNode
}

export default function WalletGate({ children }: WalletGateProps) {
  const account = useActiveAccount()
  const isConnected = !!account
  const { balance, hasEnoughPepe, neededPepe, isLoading, error, refetch } = usePepeBalance()
  const [showGate, setShowGate] = useState(true)

  useEffect(() => {
    if (isConnected && hasEnoughPepe) {
      setShowGate(false)
    } else {
      setShowGate(true)
    }
  }, [isConnected, hasEnoughPepe])

  if (!showGate) {
    return <>{children}</>
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  const renderContent = () => {
    if (!isConnected) {
      return (
        <>
          <Title>🔐 ВХОД В PEPE PORTAL</Title>
          <PepeIcon
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🐸
          </PepeIcon>
          <Description>
            Подключи свой кошелек чтобы войти в самый крутой Pepe портал!<br/>
            <strong>Требуется минимум 1,000 PEPE токенов</strong>
          </Description>
          <div style={{ margin: '1rem 0' }}>
            <ThirdwebConnectButton
              client={client}
              chains={supportedChains}
              theme="dark"
              connectModal={{
                size: "wide",
                title: "🐸 Войти в Pepe Portal",
                showThirdwebBranding: false,
              }}
              connectButton={{
                style: {
                  background: 'linear-gradient(45deg, var(--pepe-green), var(--pepe-dark-green))',
                  border: '3px solid var(--cyber-blue)',
                  color: 'white',
                  padding: '1rem 2rem',
                  fontFamily: 'Press Start 2P, cursive',
                  fontSize: '1rem',
                  borderRadius: '15px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
                  width: '100%'
                },
                label: "🔗 Подключить кошелек"
              }}
            />
          </div>
        </>
      )
    }

    if (isLoading) {
      return (
        <>
          <Title>⏳ ПРОВЕРКА БАЛАНСА</Title>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <Description>
            Проверяем количество PEPE токенов в твоем кошельке...
          </Description>
        </>
      )
    }

    if (error) {
      return (
        <>
          <Title>❌ ОШИБКА</Title>
          <PepeIcon>😵</PepeIcon>
          <ErrorMessage
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Не удалось проверить баланс. Попробуй еще раз.
          </ErrorMessage>
          <ConnectButton
            onClick={() => refetch()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Попробовать снова
          </ConnectButton>
        </>
      )
    }

    if (!hasEnoughPepe) {
      return (
        <>
          <Title>🚫 НЕДОСТАТОЧНО PEPE</Title>
          <PepeIcon
            animate={{ 
              x: [-10, 10, -10],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              duration: 0.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            😢
          </PepeIcon>
          
          <BalanceInfo>
            <BalanceValue>{formatNumber(Math.floor(balance))} PEPE</BalanceValue>
            <BalanceLabel>Твой текущий баланс</BalanceLabel>
          </BalanceInfo>
          
          <Description>
            Для входа в портал нужно минимум <strong>1,000 PEPE</strong>.<br/>
            Тебе не хватает <strong>{formatNumber(Math.ceil(neededPepe))} PEPE</strong>.
          </Description>
          
          <ConnectButton
            onClick={() => refetch()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Обновить баланс
          </ConnectButton>
          
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--matrix-green)' }}>
            💡 Купить PEPE можно на Uniswap, Binance или других биржах
          </div>
        </>
      )
    }

    return null
  }

  return (
    <GateContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <GateCard
        initial={{ scale: 0.8, rotateY: -180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      >
        {renderContent()}
      </GateCard>
    </GateContainer>
  )
} 