'use client'

import styled from 'styled-components'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton as ThirdwebConnectButton, useActiveAccount } from "thirdweb/react"
import { usePepeBalance } from '@/hooks/usePepeBalance'
import { usePepeShells } from '@/hooks/usePepeShells'
import { client, supportedChains } from '@/lib/thirdweb-config'

const NavContainer = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.9) 0%, 
    rgba(0, 50, 100, 0.8) 50%, 
    rgba(0, 0, 0, 0.9) 100%);
  backdrop-filter: blur(15px);
  border-bottom: 3px solid var(--cyber-blue);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  padding: 1rem 2rem;
`

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`

const Logo = styled(motion.div)`
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.8rem, 2.5vw, 1.2rem);
  color: var(--pepe-green);
  text-shadow: 
    0 0 10px var(--pepe-green),
    0 0 20px var(--pepe-green),
    0 0 30px var(--pepe-green);
  cursor: pointer;
`

const NavLinks = styled.div`
  display: flex;
  gap: clamp(1rem, 3vw, 2rem);
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 0.5rem;
  }
`

const NavLink = styled(motion.div)`
  position: relative;
  
  a {
    color: var(--cyber-blue);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    
    &:hover {
      color: var(--neon-pink);
      text-shadow: 0 0 10px var(--neon-pink);
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--cyber-blue), var(--neon-pink));
    transition: width 0.3s ease;
  }
  
  &:hover::after {
    width: 100%;
  }
`

const OnlineCounter = styled(motion.div)`
  background: linear-gradient(45deg, var(--pepe-green), var(--pepe-dark-green));
  border: 2px solid var(--cyber-blue);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  color: white;
  font-weight: bold;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`

const WalletButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--neon-pink), var(--electric-yellow));
  border: 2px solid var(--cyber-blue);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  color: black;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
  text-transform: uppercase;
  
  &:hover {
    box-shadow: 0 0 25px rgba(255, 0, 255, 0.5);
    transform: scale(1.05);
  }
`

const PepeBalance = styled(motion.div)`
  background: linear-gradient(45deg, var(--electric-yellow), var(--pepe-green));
  border: 2px solid var(--cyber-blue);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: clamp(0.6rem, 1.5vw, 0.8rem);
  color: black;
  font-weight: bold;
  box-shadow: 0 0 15px rgba(255, 255, 0, 0.3);
  white-space: nowrap;

  @media (max-width: 480px) {
    padding: 0.3rem 0.6rem;
  }
`

const PepeShells = styled(motion.div)`
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border: 2px solid var(--cyber-blue);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: clamp(0.6rem, 1.5vw, 0.8rem);
  color: black;
  font-weight: bold;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  white-space: nowrap;

  @media (max-width: 480px) {
    padding: 0.3rem 0.6rem;
  }
`

export default function Navbar() {
  const [onlineUsers] = useState(Math.floor(Math.random() * 1337) + 100)
  const account = useActiveAccount()
  const isConnected = !!account
  const { balance } = usePepeBalance()
  const { balance: shellBalance } = usePepeShells()
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  const formatBalance = (bal: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.floor(bal))
  }

  return (
    <NavContainer
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <NavContent>
        <Link href="/">
          <Logo
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            🐸 PEPE PORTAL
          </Logo>
        </Link>
        
        <NavLinks>
          <NavLink whileHover={{ y: -2 }}>
            <Link href="/">Главная</Link>
          </NavLink>
          <NavLink whileHover={{ y: -2 }}>
            <Link href="/profile">Профиль</Link>
          </NavLink>
          <NavLink whileHover={{ y: -2 }}>
            <Link href="/games">Игры</Link>
          </NavLink>
          <NavLink whileHover={{ y: -2 }}>
            <Link href="/chat">Чат</Link>
          </NavLink>
          <NavLink whileHover={{ y: -2 }}>
            <Link href="/shop">Магазин</Link>
          </NavLink>
          
          {isConnected && balance > 0 && (
            <PepeBalance
              animate={{ 
                boxShadow: [
                  '0 0 15px rgba(255, 255, 0, 0.3)',
                  '0 0 25px rgba(255, 255, 0, 0.6)',
                  '0 0 15px rgba(255, 255, 0, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🐸 {formatBalance(balance)} PEPE
            </PepeBalance>
          )}
          
          {isConnected && (
            <PepeShells
              animate={{ 
                boxShadow: [
                  '0 0 15px rgba(255, 215, 0, 0.3)',
                  '0 0 25px rgba(255, 215, 0, 0.6)',
                  '0 0 15px rgba(255, 215, 0, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              🐚 {shellBalance.toLocaleString()} SHELLS
            </PepeShells>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ThirdwebConnectButton
              client={client}
              chains={supportedChains}
              theme="dark"
              connectModal={{
                size: "compact",
                showThirdwebBranding: false,
              }}
              connectButton={{
                style: {
                  background: 'linear-gradient(45deg, var(--neon-pink), var(--electric-yellow))',
                  border: '2px solid var(--cyber-blue)',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  color: 'black',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)',
                },
                label: isConnected ? `👤 ${formatAddress(account?.address || '')}` : "🔗 Connect"
              }}
              detailsButton={{
                style: {
                  background: 'linear-gradient(45deg, var(--neon-pink), var(--electric-yellow))',
                  border: '2px solid var(--cyber-blue)',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}
            />
          </div>
          
          <OnlineCounter
            animate={{ 
              boxShadow: [
                '0 0 15px rgba(0, 255, 255, 0.3)',
                '0 0 25px rgba(0, 255, 255, 0.6)',
                '0 0 15px rgba(0, 255, 255, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🟢 Online: {onlineUsers}
          </OnlineCounter>
        </NavLinks>
      </NavContent>
    </NavContainer>
  )
} 