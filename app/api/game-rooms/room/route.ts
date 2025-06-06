import { NextRequest, NextResponse } from 'next/server';
import { getGameRooms } from '../route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('id');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const gameRooms = await getGameRooms();
    const room = gameRooms.find(r => r.id === roomId);
    
    if (!room) {
      return NextResponse.json({ error: 'Game room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error fetching game room:', error);
    return NextResponse.json({ error: 'Failed to fetch game room' }, { status: 500 });
  }
} 