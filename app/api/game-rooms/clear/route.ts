import { NextRequest, NextResponse } from 'next/server';
import { getGameRooms } from '../route';

export async function POST(request: NextRequest) {
  try {
    // Получаем игровые комнаты (это загружает их и инициализирует)
    const gameRooms = await getGameRooms();
    
    // Очищаем массив
    gameRooms.splice(0, gameRooms.length);

    console.log('API: All game rooms cleared');

    return NextResponse.json({ success: true, message: 'All game rooms cleared' });
  } catch (error) {
    console.error('Error clearing game rooms:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear game rooms' }, { status: 500 });
  }
} 