import { NextRequest, NextResponse } from 'next/server'
import { getGameRooms, updateGameRoom } from '../../route'

// GET - получить сообщения игрового чата
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameRoomId = params.id
    
    // Получаем комнату
    const gameRooms = await getGameRooms()
    const room = gameRooms.find(r => r.id === gameRoomId)
    if (!room) {
      return NextResponse.json({ 
        success: false, 
        error: 'Комната не найдена' 
      }, { status: 404 })
    }

    // Возвращаем сообщения чата
    return NextResponse.json({
      success: true,
      messages: (room as any).chatMessages || []
    })
  } catch (error) {
    console.error('Error getting game chat messages:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка получения сообщений' 
    }, { status: 500 })
  }
}

// POST - добавить сообщение в игровой чат
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameRoomId = params.id
    const body = await request.json()
    
    const { content, type, author } = body
    
    if (!content || !type || !author) {
      return NextResponse.json({ 
        success: false, 
        error: 'Недостаточно данных' 
      }, { status: 400 })
    }

    // Получаем комнату
    const gameRooms = await getGameRooms()
    const room = gameRooms.find(r => r.id === gameRoomId)
    if (!room) {
      return NextResponse.json({ 
        success: false, 
        error: 'Комната не найдена' 
      }, { status: 404 })
    }

    // Проверяем что пользователь участвует в игре
    if (author.address !== room.creator && author.address !== room.opponent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Только участники игры могут писать в чат' 
      }, { status: 403 })
    }

    // Создаем новое сообщение
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      author,
      timestamp: new Date()
    }

    // Инициализируем массив сообщений если его нет
    const roomWithChat = room as any
    if (!roomWithChat.chatMessages) {
      roomWithChat.chatMessages = []
    }

    // Добавляем сообщение
    roomWithChat.chatMessages.push(newMessage)
    
    // Ограничиваем историю последними 50 сообщениями
    if (roomWithChat.chatMessages.length > 50) {
      roomWithChat.chatMessages = roomWithChat.chatMessages.slice(-50)
    }

    // Обновляем комнату
    await updateGameRoom(gameRoomId, roomWithChat)

    return NextResponse.json({
      success: true,
      message: 'Сообщение добавлено',
      messageId: newMessage.id
    })
  } catch (error) {
    console.error('Error adding game chat message:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка добавления сообщения' 
    }, { status: 500 })
  }
} 