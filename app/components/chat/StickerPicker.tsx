'use client'

import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const StickerPickerContainer = styled(motion.div)`
  position: fixed;
  bottom: 160px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 1000px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid var(--cyber-blue);
  border-radius: 15px;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
  z-index: 1000;
  max-height: 350px;
  overflow: hidden;
`

const StickerHeader = styled.div`
  background: linear-gradient(90deg, var(--cyber-blue), var(--neon-pink));
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--cyber-blue);
`

const StickerTitle = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  color: black;
`

const CloseButton = styled.button`
  background: rgba(255, 0, 0, 0.2);
  border: 2px solid #ff4444;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  color: #ff4444;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 0, 0, 0.4);
    transform: scale(1.1);
  }
`

const TabsContainer = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid var(--cyber-blue);
`

const Tab = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 10px;
  background: ${props => props.isActive 
    ? 'linear-gradient(45deg, var(--cyber-blue), var(--neon-pink))'
    : 'transparent'
  };
  border: none;
  color: ${props => props.isActive ? 'black' : 'var(--cyber-blue)'};
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 255, 0.1);
  }
`

const StickersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 16px;
  max-height: 250px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
    border-radius: 4px;
  }
`

const StickerItem = styled(motion.button)`
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 4px;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  min-width: 60px;
  
  &:hover {
    border-color: var(--cyber-blue);
    background: rgba(0, 255, 255, 0.1);
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.9);
  }
`

const StickerVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  pointer-events: none;
  
  &:hover {
    filter: brightness(1.2);
  }
`

const StickerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  pointer-events: none;
`

interface StickerFile {
  id: string
  filename: string
  url: string
  name: string
}

interface StickerPickerProps {
  isOpen: boolean
  onClose: () => void
  onStickerSelect: (sticker: string) => void
}

const emojiCategories = {
  'PEPE': [
    '🐸', '🎭', '😎', '🤔', '😴', '🥴',
    '🤩', '🤯', '😵', '🤠', '🥳', '😤',
    '🔥', '💚', '👑', '💎', '🚀', '🌙',
    '⭐', '💫', '✨', '🎉', '🎊', '🏆'
  ],
  'МЕМЫ': [
    '📈', '📉', '💰', '💸', '🤑', '💵',
    '🎰', '🎲', '🎯', '🔮', '💊', '⚡',
    '🌪️', '🌊', '🔥', '❄️', '☄️', '🌈',
    '🦄', '🐉', '👹', '👺', '🤖', '👽'
  ],
  'ЭМОЦИИ': [
    '❤️', '💔', '💕', '💖', '💗', '💙',
    '💚', '💛', '🧡', '💜', '🖤', '🤍',
    '💯', '💥', '💢', '💦', '💨', '💤',
    '👍', '👎', '✌️', '🤘', '🤞', '🙏'
  ]
}

export default function StickerPicker({ isOpen, onClose, onStickerSelect }: StickerPickerProps) {
  const [activeTab, setActiveTab] = useState('ФАЙЛЫ')
  const [stickerFiles, setStickerFiles] = useState<StickerFile[]>([])
  const [loading, setLoading] = useState(false)

  // Загружаем файлы стикеров при открытии
  useEffect(() => {
    if (isOpen) {
      loadStickerFiles()
    }
  }, [isOpen])

  const loadStickerFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stickers')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStickerFiles(data.stickers)
        }
      }
    } catch (error) {
      console.error('Failed to load sticker files:', error)
    }
    setLoading(false)
  }

  const handleStickerClick = (sticker: string) => {
    onStickerSelect(sticker)
    onClose()
  }

  const handleFileClick = (file: StickerFile) => {
    // Отправляем filename как идентификатор стикера
    onStickerSelect(`file:${file.filename}`)
    onClose()
  }

  const getAllCategories = () => {
    const categories = ['ФАЙЛЫ', ...Object.keys(emojiCategories)]
    return categories
  }

  const getCurrentStickers = () => {
    if (activeTab === 'ФАЙЛЫ') {
      return stickerFiles
    }
    return emojiCategories[activeTab as keyof typeof emojiCategories] || []
  }

  const renderSticker = (item: any, index: number) => {
    if (activeTab === 'ФАЙЛЫ') {
      const file = item as StickerFile
      const isVideo = file.filename.toLowerCase().endsWith('.webm') || file.filename.toLowerCase().endsWith('.gif')
      
      return (
        <StickerItem
          key={`file-${file.id}`}
          onClick={() => handleFileClick(file)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          title={file.name}
        >
          {isVideo ? (
            <StickerVideo
              src={file.url}
              loop
              muted
              playsInline
              onMouseEnter={(e) => {
                (e.target as HTMLVideoElement).play().catch(() => {})
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLVideoElement).pause()
              }}
            />
          ) : (
            <StickerImage src={file.url} alt={file.name} />
          )}
        </StickerItem>
      )
    } else {
      const emoji = item as string
      return (
        <StickerItem
          key={`${activeTab}-${index}`}
          onClick={() => handleStickerClick(emoji)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          {emoji}
        </StickerItem>
      )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <StickerPickerContainer
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
        <StickerHeader>
          <StickerTitle>🎭 ВЫБЕРИТЕ СТИКЕР</StickerTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </StickerHeader>

        <TabsContainer>
          {getAllCategories().map((category) => (
            <Tab
              key={category}
              isActive={activeTab === category}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </Tab>
          ))}
        </TabsContainer>

        <StickersGrid>
          {loading && activeTab === 'ФАЙЛЫ' ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              color: 'var(--cyber-blue)', 
              padding: '20px',
              fontFamily: 'Press Start 2P',
              fontSize: '0.8rem'
            }}>
              📡 Загрузка стикеров...
            </div>
          ) : getCurrentStickers().length === 0 && activeTab === 'ФАЙЛЫ' ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              color: 'var(--neon-pink)', 
              padding: '20px',
              fontFamily: 'Press Start 2P',
              fontSize: '0.7rem'
            }}>
              📁 Нет файлов стикеров.<br/>Добавьте WebM файлы в папку public/stickers/
            </div>
          ) : (
            getCurrentStickers().map((item, index) => renderSticker(item, index))
          )}
        </StickersGrid>
      </StickerPickerContainer>
      )}
    </AnimatePresence>
  )
} 