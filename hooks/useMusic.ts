'use client'

import { useState, useEffect, useRef } from 'react'

export interface Track {
  id: number
  filename: string
  url: string
  title: string
  artist: string
  duration: string
}

export function useMusic() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Загружаем список треков
  const loadTracks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/music')
      const data = await response.json()
      setTracks(data.tracks || [])
    } catch (error) {
      console.error('Error loading tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Инициализируем аудио элемент
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
      audioRef.current.volume = volume

      const audio = audioRef.current

      // Обработчики событий
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime)
      }

      const handleDurationChange = () => {
        setDuration(audio.duration)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        nextTrack()
      }

      const handleLoadStart = () => {
        setCurrentTime(0)
        setDuration(0)
      }

      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('durationchange', handleDurationChange)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('loadstart', handleLoadStart)

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('durationchange', handleDurationChange)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('loadstart', handleLoadStart)
      }
    }
  }, [])

  // Загружаем треки при монтировании
  useEffect(() => {
    loadTracks()
  }, [])

  // Обновляем громкость
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Воспроизведение/пауза
  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  // Выбор трека
  const selectTrack = (track: Track) => {
    if (!audioRef.current) return

    setCurrentTrack(track)
    audioRef.current.src = track.url
    setIsPlaying(false)
    setCurrentTime(0)
  }

  // Следующий трек
  const nextTrack = () => {
    if (!currentTrack || tracks.length === 0) return
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const nextIndex = (currentIndex + 1) % tracks.length
    selectTrack(tracks[nextIndex])
  }

  // Предыдущий трек
  const prevTrack = () => {
    if (!currentTrack || tracks.length === 0) return
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    selectTrack(tracks[prevIndex])
  }

  // Перемотка
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // Форматирование времени
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return {
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
  }
} 