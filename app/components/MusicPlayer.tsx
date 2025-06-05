'use client'

import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useMusic, Track } from '@/hooks/useMusic'

const PlayerContainer = styled(motion.div)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.9) 0%, 
    rgba(0, 50, 100, 0.8) 50%, 
    rgba(0, 0, 0, 0.9) 100%);
  backdrop-filter: blur(15px);
  border: 2px solid var(--cyber-blue);
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  overflow: hidden;
  width: 320px;
`

const PlayerHeader = styled.div`
  background: linear-gradient(90deg, var(--cyber-blue), var(--neon-pink));
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`

const PlayerTitle = styled.div`
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  color: black;
  font-weight: bold;
`

const MinimizeButton = styled.button`
  background: none;
  border: none;
  color: black;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 8px;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: black;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 8px;
`

const PlayerContent = styled(motion.div)`
  padding: 16px;
`

const TrackInfo = styled.div`
  text-align: center;
  margin-bottom: 16px;
`

const TrackTitle = styled.div`
  color: var(--cyber-blue);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
  text-shadow: 0 0 10px var(--cyber-blue);
`

const TrackArtist = styled.div`
  color: var(--neon-pink);
  font-size: 12px;
`

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`

const ControlButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--cyber-blue), var(--neon-pink));
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: black;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;

  &.play {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
`

const ProgressContainer = styled.div`
  margin-bottom: 12px;
`

const ProgressBar = styled.div`
  background: rgba(0, 255, 255, 0.2);
  height: 4px;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  margin-bottom: 8px;
`

const ProgressFill = styled.div<{ progress: number }>`
  background: linear-gradient(90deg, var(--cyber-blue), var(--neon-pink));
  height: 100%;
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--cyber-blue);
`

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`

const VolumeSlider = styled.input`
  flex: 1;
  height: 4px;
  background: rgba(0, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  border: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: var(--cyber-blue);
    border-radius: 50%;
    cursor: pointer;
  }
`

const PlaylistContainer = styled(motion.div)`
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid var(--cyber-blue);
  padding-top: 12px;
`

const TrackItem = styled(motion.div)<{ isActive?: boolean }>`
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  background: ${props => props.isActive ? 
    'linear-gradient(90deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))' : 
    'transparent'};
  border: ${props => props.isActive ? '1px solid var(--cyber-blue)' : '1px solid transparent'};
  
  &:hover {
    background: rgba(0, 255, 255, 0.1);
  }
`

const TrackItemTitle = styled.div`
  color: var(--cyber-blue);
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 2px;
`

const TrackItemArtist = styled.div`
  color: var(--neon-pink);
  font-size: 10px;
`

const LoadingText = styled.div`
  color: var(--cyber-blue);
  text-align: center;
  padding: 20px;
  font-size: 12px;
`

const NoTracksText = styled.div`
  color: var(--neon-pink);
  text-align: center;
  padding: 20px;
  font-size: 12px;
`

const RefreshButton = styled(motion.button)`
  background: linear-gradient(45deg, var(--pepe-green), var(--cyber-blue));
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: black;
  font-size: 10px;
  cursor: pointer;
  font-weight: bold;
  margin: 8px auto;
  display: block;
  
  &:hover {
    transform: scale(1.05);
  }
`

export default function MusicPlayer() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    loading,
    togglePlay,
    selectTrack,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    formatTime,
    loadTracks
  } = useMusic()

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    seek(newTime)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!isVisible) {
    return (
      <motion.div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <RefreshButton
          onClick={() => setIsVisible(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          🎵 Показать плеер
        </RefreshButton>
      </motion.div>
    )
  }

  return (
    <PlayerContainer
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <PlayerHeader>
        <PlayerTitle 
          onClick={() => setIsMinimized(!isMinimized)}
          style={{ cursor: 'pointer', flex: 1 }}
        >
          🎵 CYBER PLAYER
        </PlayerTitle>
        <div>
          <MinimizeButton onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? '▲' : '▼'}
          </MinimizeButton>
          <CloseButton onClick={() => setIsVisible(false)}>
            ✕
          </CloseButton>
        </div>
      </PlayerHeader>

      <AnimatePresence>
        {!isMinimized && (
          <PlayerContent
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <LoadingText>Сканирование музыки...</LoadingText>
            ) : tracks.length === 0 ? (
              <>
                <NoTracksText>
                  Добавьте MP3 файлы в папку public/music/
                </NoTracksText>
                <RefreshButton
                  onClick={loadTracks}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 Обновить список
                </RefreshButton>
              </>
            ) : (
              <>
                {currentTrack && (
                  <>
                    <TrackInfo>
                      <TrackTitle>{currentTrack.title}</TrackTitle>
                      <TrackArtist>{currentTrack.artist}</TrackArtist>
                    </TrackInfo>

                    <Controls>
                      <ControlButton
                        onClick={prevTrack}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ⏮
                      </ControlButton>
                      
                      <ControlButton
                        className="play"
                        onClick={togglePlay}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </ControlButton>
                      
                      <ControlButton
                        onClick={nextTrack}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ⏭
                      </ControlButton>
                    </Controls>

                    <ProgressContainer>
                      <ProgressBar onClick={handleProgressClick}>
                        <ProgressFill progress={progress} />
                      </ProgressBar>
                      <TimeInfo>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </TimeInfo>
                    </ProgressContainer>
                  </>
                )}

                <VolumeContainer>
                  <span style={{ color: 'var(--cyber-blue)', fontSize: '12px' }}>🔊</span>
                  <VolumeSlider
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                  />
                </VolumeContainer>

                                 <PlaylistContainer>
                   {tracks.map((track) => (
                     <TrackItem
                       key={track.id}
                       isActive={currentTrack?.id === track.id}
                       onClick={() => selectTrack(track)}
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                     >
                       <TrackItemTitle>{track.title}</TrackItemTitle>
                       <TrackItemArtist>{track.artist}</TrackItemArtist>
                     </TrackItem>
                   ))}
                 </PlaylistContainer>

                 <RefreshButton
                   onClick={loadTracks}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                 >
                   🔄 Обновить список
                 </RefreshButton>
              </>
            )}
          </PlayerContent>
        )}
      </AnimatePresence>
    </PlayerContainer>
  )
} 