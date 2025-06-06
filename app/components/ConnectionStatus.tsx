'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  isConnected: boolean;
  isRetrying: boolean;
  retryAttempt?: number;
  error?: string;
}

const StatusContainer = styled(motion.div)<{ status: 'connected' | 'disconnected' | 'retrying' }>`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  padding: 12px 20px;
  border-radius: 10px;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  font-weight: bold;
  backdrop-filter: blur(10px);
  border: 2px solid;
  
  ${props => {
    switch (props.status) {
      case 'connected':
        return `
          background: rgba(0, 255, 0, 0.2);
          border-color: #00ff00;
          color: #00ff00;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        `;
      case 'retrying':
        return `
          background: rgba(255, 255, 0, 0.2);
          border-color: #ffff00;
          color: #ffff00;
          box-shadow: 0 0 15px rgba(255, 255, 0, 0.3);
        `;
      case 'disconnected':
        return `
          background: rgba(255, 0, 0, 0.2);
          border-color: #ff0000;
          color: #ff0000;
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
        `;
      default:
        return '';
    }
  }}
`;

const StatusIcon = styled(motion.span)`
  margin-right: 8px;
  display: inline-block;
`;

const RetryText = styled.div`
  font-size: 0.8rem;
  margin-top: 4px;
  opacity: 0.8;
`;

export default function ConnectionStatus({ 
  isConnected, 
  isRetrying, 
  retryAttempt, 
  error 
}: ConnectionStatusProps) {
  const [showStatus, setShowStatus] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Показываем статус только при проблемах или retry
  useEffect(() => {
    if (!isConnected || isRetrying || error) {
      setShowStatus(true);
      
      // Автоматически скрываем если соединение восстановлено
      if (isConnected && !isRetrying && !error) {
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 3000);
        setAutoHideTimer(timer);
      }
    } else {
      setShowStatus(false);
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [isConnected, isRetrying, error]);

  const getStatus = () => {
    if (isRetrying) return 'retrying';
    if (!isConnected || error) return 'disconnected';
    return 'connected';
  };

  const getStatusText = () => {
    if (isRetrying) {
      return retryAttempt ? `Переподключение (${retryAttempt})...` : 'Переподключение...';
    }
    if (!isConnected || error) {
      return error || 'Соединение потеряно';
    }
    return 'Соединение восстановлено';
  };

  const getIcon = () => {
    if (isRetrying) {
      return (
        <StatusIcon
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          🔄
        </StatusIcon>
      );
    }
    if (!isConnected || error) {
      return <StatusIcon>❌</StatusIcon>;
    }
    return <StatusIcon>✅</StatusIcon>;
  };

  return (
    <AnimatePresence>
      {showStatus && (
        <StatusContainer
          status={getStatus()}
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {getIcon()}
            <span>{getStatusText()}</span>
          </div>
          {error && error !== 'Network error' && (
            <RetryText>{error}</RetryText>
          )}
        </StatusContainer>
      )}
    </AnimatePresence>
  );
} 