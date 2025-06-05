import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const stickersDir = path.join(process.cwd(), 'public', 'stickers')
    
    // Проверяем что папка существует
    try {
      await fs.access(stickersDir)
    } catch {
      return NextResponse.json({ 
        stickers: [], 
        success: false, 
        error: 'Stickers directory not found' 
      })
    }

    // Читаем содержимое папки
    const files = await fs.readdir(stickersDir)
    
    // Фильтруем только webm и gif файлы
    const stickerFiles = files.filter(file => 
      file.toLowerCase().endsWith('.webm') || 
      file.toLowerCase().endsWith('.gif') ||
      file.toLowerCase().endsWith('.png') ||
      file.toLowerCase().endsWith('.webp')
    )

    // Создаем объекты стикеров с метаданными
    const stickers = stickerFiles.map(filename => ({
      id: filename.replace(/\.[^/.]+$/, ""), // убираем расширение для id
      filename: filename,
      url: `/stickers/${filename}`,
      name: filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' '), // человеко-читаемое имя
    }))

    return NextResponse.json({ 
      stickers, 
      success: true,
      count: stickers.length 
    })
  } catch (error) {
    console.error('Error loading stickers:', error)
    return NextResponse.json({ 
      stickers: [], 
      success: false, 
      error: 'Failed to load stickers' 
    })
  }
} 