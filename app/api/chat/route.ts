import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'chat-messages.json')

interface ChatMessage {
  id: string
  content: string
  type?: 'text' | 'sticker'
  author: {
    address: string
    nickname: string
    shellBalance: number
  }
  timestamp: string
  isSystem?: boolean
  replyTo?: {
    id: string
    content: string
    author: string
    type?: 'text' | 'sticker'
  }
}

// Загрузить сообщения
async function loadMessages(): Promise<ChatMessage[]> {
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8')
    const messages = JSON.parse(data)
    
    // Удаляем сообщения старше 24 часов
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    return messages.filter((msg: ChatMessage) => {
      return new Date(msg.timestamp) > dayAgo
    })
  } catch (error) {
    // Если файл не существует, вернуть системные сообщения
    return [
      {
        id: '1',
        content: '🎉 Добро пожаловать в PEPE Chat 2000! Олдскульный чат для истинных ценителей!',
        type: 'text',
        author: { address: '0x000', nickname: 'СИСТЕМА', shellBalance: 0 },
        timestamp: new Date(Date.now() - 600000).toISOString(),
        isSystem: true
      },
      {
        id: '2', 
        content: '📋 Правила: Будьте вежливы, не спамьте, минимум 1 PEPE Shell для отправки сообщений',
        type: 'text',
        author: { address: '0x000', nickname: 'СИСТЕМА', shellBalance: 0 },
        timestamp: new Date(Date.now() - 540000).toISOString(),
        isSystem: true
      },
      {
        id: '3',
        content: '🎭 Теперь доступны стикеры! Нажмите 😀 чтобы открыть панель стикеров',
        type: 'text',
        author: { address: '0x000', nickname: 'СИСТЕМА', shellBalance: 0 },
        timestamp: new Date(Date.now() - 480000).toISOString(),
        isSystem: true
      }
    ]
  }
}

// Сохранить сообщения
async function saveMessages(messages: ChatMessage[]) {
  try {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2))
  } catch (error) {
    console.error('Error saving messages:', error)
  }
}

// GET - получить сообщения
export async function GET() {
  try {
    const messages = await loadMessages()
    return NextResponse.json({ messages, success: true })
  } catch (error) {
    console.error('Error in GET /api/chat:', error)
    return NextResponse.json({ 
      messages: [], 
      success: false, 
      error: 'Failed to load messages' 
    })
  }
}

// POST - отправить сообщение
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, type = 'text', author, replyTo } = body

    // Простая валидация
    if (!content || !author?.address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing content or author' 
      }, { status: 400 })
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      type,
      author: {
        address: author.address,
        nickname: author.nickname || `User_${author.address.slice(-6)}`,
        shellBalance: author.shellBalance || 0
      },
      timestamp: new Date().toISOString()
    }

    // Добавляем информацию о reply если она есть
    if (replyTo) {
      newMessage.replyTo = {
        id: replyTo.id,
        content: replyTo.content,
        author: replyTo.author,
        type: replyTo.type
      }
    }

    const messages = await loadMessages()
    messages.push(newMessage)
    await saveMessages(messages)

    return NextResponse.json({ 
      message: newMessage, 
      success: true 
    })
  } catch (error) {
    console.error('Error in POST /api/chat:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save message' 
    }, { status: 500 })
  }
} 