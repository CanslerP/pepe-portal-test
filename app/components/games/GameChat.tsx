'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useActiveAccount } from "thirdweb/react"
import { usePepeShells } from '@/hooks/usePepeShells'
import StickerPicker from '../chat/StickerPicker'

const ChatContainer = styled.div`
  width: 300px;
  height: 500px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid var(--cyber-blue);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);

  @media (max-width: 1200px) {
    width: 280px;
    height: 400px;
  }

  @media (max-width: 600px) {
    width: 100%;
    height: 300px;
  }
`

const ChatHeader = styled.div`
  background: linear-gradient(90deg, var(--cyber-blue), var(--neon-pink));
  padding: 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  color: black;
  text-align: center;
  border-bottom: 2px solid var(--cyber-blue);
`

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
    border-radius: 3px;
  }
`

const Message = styled(motion.div)<{ isOwn?: boolean }>`
  padding: 8px 12px;
  border-radius: 10px;
  max-width: 85%;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  background: ${props => props.isOwn 
    ? 'linear-gradient(135deg, var(--neon-pink), var(--cyber-blue))'
    : 'rgba(255, 255, 255, 0.1)'
  };
  border: 1px solid ${props => props.isOwn ? 'transparent' : 'var(--cyber-blue)'};
  word-wrap: break-word;
`

const MessageAuthor = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  color: var(--electric-yellow);
  margin-bottom: 4px;
`

const MessageContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isSticker',
})<{ isSticker?: boolean }>`
  color: white;
  font-size: ${props => props.isSticker ? '2rem' : '0.8rem'};
  font-family: ${props => props.isSticker ? 'inherit' : "'Orbitron', monospace"};
  text-align: ${props => props.isSticker ? 'center' : 'left'};
  line-height: 1.2;
`

const StickerFile = styled.video`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--cyber-blue);
`

const StickerImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--cyber-blue);
`

const InputArea = styled.div`
  border-top: 1px solid var(--cyber-blue);
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
`

const InputForm = styled.form`
  display: flex;
  gap: 8px;
  align-items: center;
`

const MessageInput = styled.input`
  flex: 1;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid var(--cyber-blue);
  border-radius: 8px;
  color: white;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  padding: 8px 12px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    border-color: var(--neon-pink);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SendButton = styled.button`
  background: linear-gradient(45deg, var(--pepe-green), var(--cyber-blue));
  border: none;
  border-radius: 6px;
  color: black;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const StickerButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--electric-yellow), var(--pepe-green));
  border: none;
  border-radius: 6px;
  color: black;
  font-size: 0.9rem;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Timestamp = styled.div`
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
  font-family: 'Orbitron', monospace;
`

interface GameMessage {
  id: string
  content: string
  type: 'text' | 'sticker'
  author: {
    address: string
    nickname: string
  }
  timestamp: Date
}

interface GameChatProps {
  gameRoomId?: string
  title?: string
}

export default function GameChat({ gameRoomId, title = "🎮 ИГРОВОЙ ЧАТ" }: GameChatProps) {
  const account = useActiveAccount()
  const { balance } = usePepeShells()
  
  const [messages, setMessages] = useState<GameMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Кулдаун таймер
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Загрузка сообщений
  const loadMessages = async () => {
    if (!gameRoomId) return

    try {
      const response = await fetch(`/api/game-rooms/${gameRoomId}/chat`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })))
        }
      }
    } catch (error) {
      console.error('Failed to load game chat messages:', error)
    }
  }

  // Синхронизация сообщений каждые 3 секунды
  useEffect(() => {
    if (!gameRoomId) return

    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [gameRoomId])

  // Отправка текстового сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !account?.address || balance < 1 || cooldown > 0 || !gameRoomId) {
      return
    }

    try {
      const messageData = {
        content: inputMessage.trim(),
        type: 'text',
        author: {
          address: account.address,
          nickname: `Player_${account.address.slice(-6)}`
        }
      }

      const response = await fetch(`/api/game-rooms/${gameRoomId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setInputMessage('')
          setCooldown(2) // 2 секунды кулдаун
          await loadMessages()
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Отправка стикера
  const handleStickerSelect = async (sticker: string) => {
    if (!account?.address || balance < 1 || cooldown > 0 || !gameRoomId) return

    try {
      const messageData = {
        content: sticker,
        type: 'sticker',
        author: {
          address: account.address,
          nickname: `Player_${account.address.slice(-6)}`
        }
      }

      const response = await fetch(`/api/game-rooms/${gameRoomId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCooldown(2) // 2 секунды кулдаун
          setIsStickerPickerOpen(false)
          await loadMessages()
        }
      }
    } catch (error) {
      console.error('Failed to send sticker:', error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      <ChatContainer>
        <ChatHeader>
          {title}
        </ChatHeader>
        
        <MessagesArea>
          {messages.map((message) => {
            const isOwn = message.author.address === account?.address
            
            return (
              <Message
                key={message.id}
                isOwn={isOwn}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!isOwn && (
                  <MessageAuthor>
                    {message.author.nickname}
                  </MessageAuthor>
                )}
                
                <MessageContent isSticker={message.type === 'sticker'}>
                  {message.type === 'sticker' && message.content.startsWith('file:') ? (
                    // Файл стикер
                    (() => {
                      const filename = message.content.replace('file:', '')
                      const isVideo = filename.toLowerCase().endsWith('.webm') || filename.toLowerCase().endsWith('.gif')
                      const stickerUrl = `/stickers/${filename}`
                      
                      return isVideo ? (
                        <StickerFile
                          src={stickerUrl}
                          loop
                          muted
                          autoPlay
                          playsInline
                          title={filename}
                        />
                      ) : (
                        <StickerImage 
                          src={stickerUrl} 
                          alt={filename}
                          title={filename}
                        />
                      )
                    })()
                  ) : (
                    // Эмодзи стикер или текст
                    message.content
                  )}
                </MessageContent>
                
                <Timestamp>
                  {formatTime(message.timestamp)}
                </Timestamp>
              </Message>
            )
          })}
          <div ref={messagesEndRef} />
        </MessagesArea>

        <InputArea>
          <InputForm onSubmit={handleSendMessage}>
            <StickerButton
              type="button"
              onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
              disabled={balance < 1 || cooldown > 0}
              whileHover={balance >= 1 && cooldown === 0 ? { scale: 1.05 } : {}}
              whileTap={balance >= 1 && cooldown === 0 ? { scale: 0.95 } : {}}
              style={{
                background: isStickerPickerOpen 
                  ? 'linear-gradient(45deg, var(--neon-pink), var(--cyber-blue))'
                  : 'linear-gradient(45deg, var(--electric-yellow), var(--pepe-green))'
              }}
            >
              {isStickerPickerOpen ? '🎭' : '😀'}
            </StickerButton>
            
            <MessageInput
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                balance < 1 
                  ? 'Нужно 1+ SHELLS'
                  : cooldown > 0
                  ? `Подождите ${cooldown}с...`
                  : 'Написать в игровой чат...'
              }
              disabled={balance < 1 || cooldown > 0}
              maxLength={200}
            />
            
            <SendButton
              type="submit"
              disabled={!inputMessage.trim() || balance < 1 || cooldown > 0}
            >
              📤
            </SendButton>
          </InputForm>
        </InputArea>
      </ChatContainer>
      
      {/* Picker стикеров */}
      <StickerPicker
        isOpen={isStickerPickerOpen}
        onClose={() => setIsStickerPickerOpen(false)}
        onStickerSelect={handleStickerSelect}
      />
    </>
  )
} 