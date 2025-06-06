import { NextRequest } from 'next/server';
import { getGameRooms } from '../route';

// Храним активные SSE соединения
const connections = new Map<string, ReadableStreamDefaultController>();
const roomSubscriptions = new Map<string, Set<string>>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const playerAddress = searchParams.get('playerAddress');

  if (!roomId || !playerAddress) {
    return new Response('Missing roomId or playerAddress', { status: 400 });
  }

  // Создаем уникальный ID для соединения
  const connectionId = `${roomId}_${playerAddress}_${Date.now()}`;

  // Создаем ReadableStream для SSE
  const stream = new ReadableStream({
    start(controller) {
      // Сохраняем контроллер для отправки данных
      connections.set(connectionId, controller);
      
      // Добавляем в подписки комнаты
      if (!roomSubscriptions.has(roomId)) {
        roomSubscriptions.set(roomId, new Set());
      }
      roomSubscriptions.get(roomId)!.add(connectionId);

      // Отправляем начальное состояние
      sendSSEMessage(controller, 'connected', { 
        connectionId,
        message: 'Connected to game room stream' 
      });

      // Отправляем текущее состояние игры
      getGameRooms().then(gameRooms => {
        const room = gameRooms.find(r => r.id === roomId);
        if (room) {
          sendSSEMessage(controller, 'game_state', { room });
          
          // Отправляем список игроков онлайн
          const playersOnline = Array.from(roomSubscriptions.get(roomId) || []);
          sendSSEMessage(controller, 'players_online', { 
            count: playersOnline.length,
            players: playersOnline 
          });
        }
      }).catch(console.error);

      // Keep-alive пинг каждые 30 секунд
      const pingInterval = setInterval(() => {
        try {
          sendSSEMessage(controller, 'ping', { timestamp: Date.now() });
        } catch (error) {
          // Соединение закрыто
          clearInterval(pingInterval);
          cleanup(connectionId, roomId);
        }
      }, 30000);

      // Очистка при закрытии соединения
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        cleanup(connectionId, roomId);
      });
    },

    cancel() {
      cleanup(connectionId, roomId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

function sendSSEMessage(controller: ReadableStreamDefaultController, type: string, data: any) {
  const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

function cleanup(connectionId: string, roomId: string) {
  connections.delete(connectionId);
  
  const roomSubs = roomSubscriptions.get(roomId);
  if (roomSubs) {
    roomSubs.delete(connectionId);
    if (roomSubs.size === 0) {
      roomSubscriptions.delete(roomId);
    } else {
      // Уведомляем остальных игроков об изменении количества онлайн
      broadcastToRoom(roomId, 'players_online', {
        count: roomSubs.size,
        players: Array.from(roomSubs)
      });
    }
  }
}

// Функция для отправки сообщений всем игрокам в комнате
export function broadcastToRoom(roomId: string, type: string, data: any) {
  const roomSubs = roomSubscriptions.get(roomId);
  if (!roomSubs) return;

  roomSubs.forEach(connectionId => {
    const controller = connections.get(connectionId);
    if (controller) {
      try {
        sendSSEMessage(controller, type, data);
      } catch (error) {
        // Соединение закрыто, удаляем его
        connections.delete(connectionId);
        roomSubs.delete(connectionId);
      }
    }
  });
}

// Функция для уведомления об обновлении игры
export function notifyGameUpdate(roomId: string, gameData: any) {
  broadcastToRoom(roomId, 'game_update', gameData);
}

// Функция для уведомления о смене игрока
export function notifyPlayerAction(roomId: string, action: string, playerData: any) {
  broadcastToRoom(roomId, 'player_action', { action, ...playerData });
} 