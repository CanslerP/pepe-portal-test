import { NextResponse } from 'next/server';

// POST - создать тестовые игры
export async function POST() {
  try {
    const testPlayers = [
      { address: '0x1234567890123456789012345678901234567890', name: 'TestPlayer1' },
      { address: '0x9876543210987654321098765432109876543210', name: 'TestPlayer2' },
      { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', name: 'TestPlayer3' }
    ];

    const gameTypes: ('go' | 'chess' | 'tictactoe')[] = ['go', 'chess', 'tictactoe'];
    const createdRooms = [];

    for (let i = 0; i < testPlayers.length; i++) {
      const player = testPlayers[i];
      const gameData = {
        creator: player.address,
        creatorName: player.name,
        betAmount: (i + 1) * 50,
        gameType: gameTypes[i % 3],
      };

      // Создаем игру через основной API
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/game-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          createdRooms.push(data.room);
        }
      }
    }

    console.log('API: Created', createdRooms.length, 'test game rooms');

    return NextResponse.json({
      success: true,
      message: `Созданы ${createdRooms.length} тестовые игры от разных игроков!`,
      rooms: createdRooms
    });
  } catch (error) {
    console.error('Error creating test game rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test game rooms' },
      { status: 500 }
    );
  }
} 