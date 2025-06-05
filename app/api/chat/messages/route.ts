import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'chat-messages.json')

interface ChatMessage {
  id: string
  content: string
  author: {
    address: string
    nickname: string
    shellBalance: number
  }
  timestamp: string
  isSystem?: boolean
}

// Убедимся что папка data существует
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Загрузить сообщения из файла
async function loadMessages(): Promise<ChatMessage[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8')
    const messages = JSON.parse(data)
    
    // Удаляем сообщения старше 24 часов
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const filteredMessages = messages.filter((msg: ChatMessage) => {
      return new Date(msg.timestamp) > dayAgo
    })
    
    // Если что-то было удалено, сохраняем обновленный список
    if (filteredMessages.length !== messages.length) {
      await saveMessages(filteredMessages)
    }
    
    return filteredMessages
  } catch (error) {
    // Если файл не существует, создаем его с системными сообщениями
    const systemMessages: ChatMessage[] = [
      {
        id: '1',
        content: '🎉 Добро пожаловать в PEPE Chat 2000! Олдскульный чат для истинных ценителей!',
        author: { address: '0x000', nickname: 'СИСТЕМА', shellBalance: 0 },
        timestamp: new Date(Date.now() - 600000).toISOString(),
        isSystem: true
      },
      {
        id: '2',
        content: '📋 Правила: Будьте вежливы, не спамьте, минимум 1 PEPE Shell для отправки сообщений',
        author: { address: '0x000', nickname: 'СИСТЕМА', shellBalance: 0 },
        timestamp: new Date(Date.now() - 540000).toISOString(),
        isSystem: true
      },
      {
        id: '3',
        content: '💬 Сообщения автоматически удаляются через 24 часа',
        author: { address: '0x000', nickname: 'СИСТЕМА', shellBalance: 0 },
        timestamp: new Date(Date.now() - 480000).toISOString(),
        isSystem: true
      }
    ]
    
    await saveMessages(systemMessages)
    return systemMessages
  }
}

// Сохранить сообщения в файл
async function saveMessages(messages: ChatMessage[]) {
  await ensureDataDir()
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2))
}

// GET - получить все сообщения
export async function GET() {
  try {
    const messages = await loadMessages()
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error loading messages:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

// POST - добавить новое сообщение
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, author } = body

    // Валидация
    if (!content || !author || !author.address || !author.nickname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Создаем новое сообщение
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      author: {
        address: author.address,
        nickname: author.nickname,
        shellBalance: author.shellBalance || 0
      },
      timestamp: new Date().toISOString()
    }

    // Загружаем существующие сообщения и добавляем новое
    const messages = await loadMessages()
    messages.push(newMessage)

    // Сохраняем обновленный список
    await saveMessages(messages)

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Error saving message:', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }
} 