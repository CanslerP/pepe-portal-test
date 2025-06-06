import { NextRequest, NextResponse } from 'next/server';
import { getGameRooms } from '../route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const gameRooms = await getGameRooms();
    
    if (roomId) {
      // Ищем конкретную комнату
      const room = gameRooms.find(r => r.id === roomId);
      
      return NextResponse.json({
        success: true,
        debug: {
          searchedRoomId: roomId,
          totalRooms: gameRooms.length,
          foundRoom: room ? true : false,
          roomData: room || null,
          allRoomIds: gameRooms.map(r => r.id)
        }
      });
    } else {
      // Возвращаем информацию о всех комнатах
      return NextResponse.json({
        success: true,
        debug: {
          totalRooms: gameRooms.length,
          rooms: gameRooms.map(r => ({
            id: r.id,
            gameType: r.gameType,
            status: r.status,
            creator: r.creator,
            opponent: r.opponent,
            createdAt: r.createdAt
          }))
        }
      });
    }
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Debug API failed' }, { status: 500 });
  }
} 