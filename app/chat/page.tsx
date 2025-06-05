'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useActiveAccount } from "thirdweb/react"
import { usePepeShells } from '@/hooks/usePepeShells'
import StickerPicker from '../components/chat/StickerPicker'

const ChatContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%);
  padding: 120px 20px 40px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="2" cy="2" r="1" fill="%2300ffff" opacity="0.1"/></svg>') repeat;
    animation: matrix 20s linear infinite;
    pointer-events: none;
  }

  @keyframes matrix {
    0% { transform: translateY(0); }
    100% { transform: translateY(-20px); }
  }
`

const ChatTitle = styled.h1`
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(1.2rem, 4vw, 2rem);
  color: var(--cyber-blue);
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 0 20px var(--cyber-blue);
  animation: glow 2s ease-in-out infinite alternate;

  @keyframes glow {
    from { text-shadow: 0 0 20px var(--cyber-blue); }
    to { text-shadow: 0 0 30px var(--cyber-blue), 0 0 40px var(--neon-pink); }
  }
`

const ChatWindow = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  height: calc(100vh - 300px);
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid var(--cyber-blue);
  border-radius: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`

const ChatHeader = styled.div`
  background: linear-gradient(90deg, var(--cyber-blue), var(--neon-pink));
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--cyber-blue);
`

const HeaderInfo = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: black;
`

const OnlineCount = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  color: black;
  display: flex;
  align-items: center;
  gap: 8px;
`

const MessagesArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 255, 255, 0.1);
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
    border-radius: 6px;
  }
`

const MessageItem = styled(motion.div)<{ isOwn?: boolean; isSystem?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
`

const MessageBubble = styled.div<{ isOwn?: boolean; isSystem?: boolean }>`
  background: ${props => {
    if (props.isSystem) return 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.1))'
    if (props.isOwn) return 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.1))'
    return 'rgba(0, 0, 0, 0.6)'
  }};
  border: 2px solid ${props => {
    if (props.isSystem) return 'var(--electric-yellow)'
    if (props.isOwn) return 'var(--cyber-blue)'
    return 'var(--neon-pink)'
  }};
  border-radius: ${props => {
    if (props.isSystem) return '15px'
    if (props.isOwn) return '15px 15px 5px 15px'
    return '15px 15px 15px 5px'
  }};
  padding: 12px 16px;
  max-width: 70%;
  word-wrap: break-word;
  backdrop-filter: blur(10px);
  position: relative;
`

const MessageHeader = styled.div<{ isOwn?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  justify-content: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`

const AuthorName = styled.span<{ shellBalance?: number }>`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  color: ${props => {
    if (!props.shellBalance) return 'var(--electric-yellow)'
    if (props.shellBalance > 10000) return '#FFD700'
    if (props.shellBalance > 5000) return '#C0C0C0'
    if (props.shellBalance > 1000) return '#CD7F32'
    return 'var(--cyber-blue)'
  }};
  text-shadow: 0 0 5px currentColor;
`

const Timestamp = styled.span`
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Orbitron', monospace;
`

const MessageContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isSticker',
})<{ isSticker?: boolean }>`
  color: white;
  font-family: ${props => props.isSticker ? 'inherit' : "'Orbitron', monospace"};
  font-size: ${props => props.isSticker ? '3rem' : '0.9rem'};
  line-height: 1.4;
  text-align: ${props => props.isSticker ? 'center' : 'left'};
  padding: ${props => props.isSticker ? '8px' : '0'};
`

const StickerFile = styled.video`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid var(--cyber-blue);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`

const StickerImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid var(--cyber-blue);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`

const InputArea = styled.div`
  border-top: 2px solid var(--cyber-blue);
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
`

const InputForm = styled.form`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  position: relative;
`

const StickerButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--electric-yellow), var(--pepe-green));
  border: 2px solid var(--electric-yellow);
  border-radius: 10px;
  color: black;
  padding: 12px 16px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(100, 100, 100, 0.5);
  }
`

const ReplyButton = styled(motion.button)`
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid var(--cyber-blue);
  border-radius: 8px;
  color: var(--cyber-blue);
  padding: 4px 8px;
  font-size: 0.7rem;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  margin-top: 4px;
  
  &:hover {
    background: rgba(0, 255, 255, 0.2);
    transform: scale(1.05);
  }
`

const ReplyPreview = styled(motion.div)`
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid var(--cyber-blue);
  border-radius: 10px 10px 0 0;
  padding: 12px 16px;
  margin-bottom: -2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ReplyInfo = styled.div`
  color: var(--cyber-blue);
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
`

const ReplyContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  margin-top: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CloseReplyButton = styled.button`
  background: none;
  border: none;
  color: #ff4444;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    transform: scale(1.2);
  }
`

const ReplyReference = styled.div`
  background: rgba(0, 255, 255, 0.1);
  border-left: 3px solid var(--cyber-blue);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`

const ReplyAuthor = styled.div`
  color: var(--cyber-blue);
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  margin-bottom: 4px;
`

const ReplyText = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isSticker',
})<{ isSticker?: boolean }>`
  color: rgba(255, 255, 255, 0.8);
  font-family: ${props => props.isSticker ? 'inherit' : "'Orbitron', monospace"};
  font-size: ${props => props.isSticker ? '1.5rem' : '0.75rem'};
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MessageInput = styled.input`
  flex: 1;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--cyber-blue);
  border-radius: 10px;
  color: white;
  padding: 12px 16px;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--neon-pink);
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SendButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
  border: 2px solid var(--cyber-blue);
  border-radius: 10px;
  color: white;
  padding: 12px 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(100, 100, 100, 0.5);
  }
`

const StatusBar = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-top: 1px solid var(--cyber-blue);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
`

const WalletWarning = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid #ff4444;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  margin: 20px;
  backdrop-filter: blur(10px);
`

const WarningTitle = styled.h2`
  font-family: 'Press Start 2P', monospace;
  color: #ff4444;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px #ff4444;
`

const WarningText = styled.p`
  font-family: 'Orbitron', monospace;
  color: white;
  font-size: 1rem;
  line-height: 1.6;
`

interface ChatMessage {
  id: string
  content: string
  type?: 'text' | 'sticker'
  author: {
    address: string
    nickname: string
    shellBalance: number
  }
  timestamp: Date
  isSystem?: boolean
  replyTo?: {
    id: string
    content: string
    author: string
    type?: 'text' | 'sticker'
  }
}

export default function ChatPage() {
  const account = useActiveAccount()
  const { balance } = usePepeShells()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [onlineUsers] = useState(42) // Временно захардкожено
  const [cooldown, setCooldown] = useState(0)
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Автоскролл к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Загрузка сообщений с сервера
  const loadMessages = async () => {
    try {
      const response = await fetch('/api/chat')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.messages) {
          setMessages(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })))
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  // Загружаем сообщения при первом входе
  useEffect(() => {
    loadMessages()
  }, [])

  // Периодическое обновление сообщений каждые 10 секунд  
  useEffect(() => {
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  // Кулдаун между сообщениями
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !account?.address || balance < 1 || cooldown > 0) return

    try {
      const messageData: any = {
        content: inputMessage.trim(),
        type: 'text',
        author: {
          address: account.address,
          nickname: `Pepe_${account.address.slice(-6)}`,
          shellBalance: balance
        }
      }

      // Добавляем информацию о reply если отвечаем на сообщение
      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          content: replyingTo.content,
          author: replyingTo.author.nickname,
          type: replyingTo.type
        }
      }

      const response = await fetch('/api/chat', {
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
          setReplyingTo(null) // Очищаем reply
          setCooldown(2) // 2 секунды кулдаун
          // Обновляем сообщения сразу после отправки
          await loadMessages()
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStickerSelect = async (sticker: string) => {
    if (!account?.address || balance < 1 || cooldown > 0) return

    try {
      const messageData: any = {
        content: sticker,
        type: 'sticker',
        author: {
          address: account.address,
          nickname: `Pepe_${account.address.slice(-6)}`,
          shellBalance: balance
        }
      }

      // Добавляем информацию о reply если отвечаем на сообщение
      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          content: replyingTo.content,
          author: replyingTo.author.nickname,
          type: replyingTo.type
        }
      }

      const response = await fetch('/api/chat', {
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
          setReplyingTo(null) // Очищаем reply
          // Обновляем сообщения сразу после отправки
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

  const getRankEmoji = (shellBalance: number) => {
    if (shellBalance > 10000) return '🥇'
    if (shellBalance > 5000) return '🥈'
    if (shellBalance > 1000) return '🥉'
    return '🐸'
  }

  if (!account) {
    return (
      <ChatContainer>
        <ChatTitle>💬 PEPE CHAT 2000</ChatTitle>
        <ChatWindow>
          <WalletWarning>
            <WarningTitle>🚫 ДОСТУП ОГРАНИЧЕН</WarningTitle>
            <WarningText>
              Для доступа к чату необходимо подключить кошелек!
              <br /><br />
              Только холдеры PEPE могут участвовать в беседе.
              <br />
              Подключите кошелек через меню сверху.
            </WarningText>
          </WalletWarning>
        </ChatWindow>
      </ChatContainer>
    )
  }

  return (
    <ChatContainer>
      <ChatTitle>💬 PEPE CHAT 2000</ChatTitle>
      
      <ChatWindow>
        <ChatHeader>
          <HeaderInfo>ОЛДСКУЛ ЧАТ</HeaderInfo>
          <OnlineCount>
            🟢 Онлайн: {onlineUsers}
          </OnlineCount>
        </ChatHeader>

        <MessagesArea>
          {messages.map((message) => {
            const isOwnMessage = message.author.address === account.address
            
            return (
              <MessageItem
                key={message.id}
                isOwn={isOwnMessage}
                isSystem={message.isSystem}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                                 <MessageHeader isOwn={isOwnMessage}>
                   <AuthorName shellBalance={message.author.shellBalance}>
                     {getRankEmoji(message.author.shellBalance)} {message.author.nickname}
                   </AuthorName>
                   <Timestamp>{formatTime(message.timestamp)}</Timestamp>
                 </MessageHeader>
                 
                 <MessageBubble isOwn={isOwnMessage} isSystem={message.isSystem}>
                   {/* Показываем ссылку на оригинальное сообщение если это reply */}
                   {message.replyTo && (
                     <ReplyReference>
                       <ReplyAuthor>↳ {message.replyTo.author}</ReplyAuthor>
                       <ReplyText isSticker={message.replyTo.type === 'sticker'}>
                         {message.replyTo.type === 'sticker' && message.replyTo.content.startsWith('file:') ? (
                           `📁 ${message.replyTo.content.replace('file:', '').replace(/\.[^/.]+$/, "")}`
                         ) : (
                           message.replyTo.content
                         )}
                       </ReplyText>
                     </ReplyReference>
                   )}
                   
                   <MessageContent isSticker={message.type === 'sticker'}>
                     {message.type === 'sticker' && message.content.startsWith('file:') ? (
                       // Отображаем файл стикера
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
                       // Отображаем эмодзи стикер или текст
                       message.content
                     )}
                   </MessageContent>
                   
                   {/* Кнопка reply только для чужих сообщений */}
                   {!isOwnMessage && !message.isSystem && (
                     <ReplyButton
                       onClick={() => setReplyingTo(message)}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                     >
                       ↩️ ОТВЕТИТЬ
                     </ReplyButton>
                   )}
                 </MessageBubble>
              </MessageItem>
            )
          })}
          <div ref={messagesEndRef} />
        </MessagesArea>

        <StatusBar>
          <div>💰 Баланс: {balance} PEPE Shells</div>
          <div>
            {cooldown > 0 ? `⏱️ Кулдаун: ${cooldown}с` : '✅ Готов к отправке'}
          </div>
        </StatusBar>

        <InputArea>
          <StickerPicker
            isOpen={isStickerPickerOpen}
            onClose={() => setIsStickerPickerOpen(false)}
            onStickerSelect={handleStickerSelect}
          />
          
          {/* Превью сообщения на которое отвечаем */}
          {replyingTo && (
            <ReplyPreview
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div>
                <ReplyInfo>↩️ Ответ на: {replyingTo.author.nickname}</ReplyInfo>
                                 <ReplyContent>
                   {replyingTo.type === 'sticker' && replyingTo.content.startsWith('file:') ? (
                     `📁 ${replyingTo.content.replace('file:', '').replace(/\.[^/.]+$/, "")}`
                   ) : (
                     replyingTo.content
                   )}
                 </ReplyContent>
              </div>
              <CloseReplyButton onClick={() => setReplyingTo(null)}>
                ✕
              </CloseReplyButton>
            </ReplyPreview>
          )}
          
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
                  ? 'Нужно минимум 1 PEPE Shell для отправки сообщений'
                  : cooldown > 0
                  ? `Подождите ${cooldown} сек...`
                  : replyingTo
                  ? `Ответ для ${replyingTo.author.nickname}...`
                  : 'Напишите сообщение в олдскульном стиле...'
              }
              disabled={balance < 1 || cooldown > 0}
              maxLength={500}
            />
            
            <SendButton
              type="submit"
              disabled={!inputMessage.trim() || balance < 1 || cooldown > 0}
              whileHover={balance >= 1 && cooldown === 0 ? { scale: 1.05 } : {}}
              whileTap={balance >= 1 && cooldown === 0 ? { scale: 0.95 } : {}}
            >
              {balance < 1 ? '⚠️ НУЖНО SHELLS' : replyingTo ? '↩️ ОТВЕТИТЬ' : '📤 ОТПРАВИТЬ'}
            </SendButton>
          </InputForm>
        </InputArea>
      </ChatWindow>
    </ChatContainer>
  )
} 