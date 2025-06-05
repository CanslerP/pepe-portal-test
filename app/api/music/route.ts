import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), 'public', 'music')
    
    // Создаем папку music если её нет
    try {
      await fs.access(musicDir)
    } catch {
      await fs.mkdir(musicDir, { recursive: true })
      return NextResponse.json({ tracks: [] })
    }

    // Читаем все файлы в папке music
    const files = await fs.readdir(musicDir)
    
    // Фильтруем только MP3 файлы
    const mp3Files = files.filter(file => 
      file.toLowerCase().endsWith('.mp3')
    )

    // Формируем список треков с метаданными
    const tracks = mp3Files.map((file, index) => {
      const nameWithoutExt = file.replace('.mp3', '')
      const parts = nameWithoutExt.split(' - ')
      
      return {
        id: index + 1,
        filename: file,
        url: `/music/${file}`,
        title: parts.length > 1 ? parts[1] : nameWithoutExt,
        artist: parts.length > 1 ? parts[0] : 'Unknown Artist',
        duration: '0:00'
      }
    })

    return NextResponse.json({ 
      tracks,
      count: tracks.length 
    })
  } catch (error) {
    console.error('Error scanning music directory:', error)
    return NextResponse.json(
      { error: 'Failed to scan music directory' },
      { status: 500 }
    )
  }
} 