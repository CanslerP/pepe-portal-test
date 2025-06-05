'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useActiveAccount } from "thirdweb/react";

interface ChatMessage {
  id: string;
  player: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

interface GameChatProps {
  gameRoomId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<boolean>;
}

const ChatContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 420px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ffff;
  border-radius: 15px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  flex-shrink: 0;

  @media (max-width: 1200px) {
    width: 100%;
    max-width: 420px;
    height: 300px;
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  color: #000;
  padding: 10px 15px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  text-align: center;
  font-weight: bold;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: #00ffff;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #ff00ff;
  }
`;

const ScrollToBottomButton = styled.button<{ show: boolean }>`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(45deg, #00ff00, #00ffff);
  border: none;
  color: #000;
  font-size: 1.2rem;
  cursor: pointer;
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 255, 255, 0.3);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }
`;

const MessageBubble = styled(motion.div)<{ isOwn: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 15px;
  background: ${props => props.isOwn 
    ? 'linear-gradient(45deg, #ff00ff, #00ffff)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.isOwn ? '#000' : '#fff'};
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  word-wrap: break-word;
  border: 1px solid ${props => props.isOwn ? 'transparent' : '#333'};
`;

const MessageMeta = styled.div<{ isOwn: boolean }>`
  font-family: 'Orbitron', monospace;
  font-size: 0.6rem;
  color: ${props => props.isOwn ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
  margin-bottom: 4px;
`;

const MessageText = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  line-height: 1.3;
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #333;
  gap: 8px;
`;

const InputField = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;

  &:focus {
    outline: none;
    border-color: #00ffff;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  background: ${props => props.disabled 
    ? 'rgba(128, 128, 128, 0.3)' 
    : 'linear-gradient(45deg, #00ff00, #00ffff)'};
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  color: ${props => props.disabled ? '#666' : '#000'};
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  text-align: center;
`;

export default function GameChat({ gameRoomId, messages, onSendMessage }: GameChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const account = useActiveAccount();

  // Функция для проверки, внизу ли пользователь
  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setShowScrollButton(!isAtBottom);
    }
  };

  // Автоматическая прокрутка к последнему сообщению (только если пользователь уже внизу)
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      if (isAtBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [messages]);

  // Функция для скролла к низу
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading || !account?.address) return;

    setIsLoading(true);
    const success = await onSendMessage(inputMessage.trim());
    
    if (success) {
      setInputMessage('');
    }
    
    setIsLoading(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <ChatContainer
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ChatHeader>
        💬 GAME CHAT
      </ChatHeader>

      <MessagesContainer 
        ref={messagesContainerRef}
        onScroll={checkScrollPosition}
      >
        {messages.length === 0 ? (
          <EmptyState>
            Начните разговор!<br />
            Напишите первое сообщение
          </EmptyState>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.player === account?.address;
            return (
              <MessageBubble
                key={msg.id}
                isOwn={isOwn}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MessageMeta isOwn={isOwn}>
                  {isOwn ? 'Вы' : msg.playerName} • {formatTimestamp(msg.timestamp)}
                </MessageMeta>
                <MessageText>{msg.message}</MessageText>
              </MessageBubble>
            );
          })
        )}
        <div ref={messagesEndRef} />
        
        <ScrollToBottomButton 
          show={showScrollButton} 
          onClick={scrollToBottom}
          title="Скролл к низу"
        >
          ↓
        </ScrollToBottomButton>
      </MessagesContainer>

      <ChatInput>
        <form onSubmit={handleSend} style={{ display: 'flex', width: '100%', gap: '8px' }}>
          <InputField
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            maxLength={500}
            disabled={isLoading}
          />
          <SendButton 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
          >
            {isLoading ? '...' : '↑'}
          </SendButton>
        </form>
      </ChatInput>
    </ChatContainer>
  );
} 