const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  // Создаем Socket.IO сервер
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? true  // Разрешаем все домены в production
        : ["http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  // Хранилище игровых комнат и подключений
  const gameRooms = new Map();
  const playerConnections = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 Player connected:', socket.id);

    // Присоединение к игровой комнате
    socket.on('join-room', ({ roomId, playerAddress }) => {
      console.log(`👤 Player ${playerAddress} joining room ${roomId}`);
      
      socket.join(roomId);
      playerConnections.set(socket.id, { roomId, playerAddress });
      
      // Уведомляем других игроков в комнате
      socket.to(roomId).emit('player-joined', {
        playerAddress,
        message: `${playerAddress} присоединился к игре`
      });

      // Отправляем текущее состояние игры
      if (gameRooms.has(roomId)) {
        socket.emit('game-state', gameRooms.get(roomId));
      }
    });

    // Игровое действие (ход)
    socket.on('game-action', async ({ roomId, action }) => {
      console.log(`🎮 Game action in room ${roomId}:`, action.type);
      
      try {
        // Здесь можно обрабатывать через ваш existing API
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `http://127.0.0.1:${port}` 
          : `http://localhost:${port}`;
        const response = await fetch(`${baseUrl}/api/game-rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Сохраняем состояние в памяти
          gameRooms.set(roomId, result.gameState);
          
          // Отправляем обновление всем игрокам в комнате
          io.to(roomId).emit('game-update', {
            gameState: result.gameState,
            undoMove: result.undoMove,
            action: action.type
          });
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Game action error:', error);
        socket.emit('error', { message: 'Ошибка обработки хода' });
      }
    });

    // Покидание комнаты
    socket.on('leave-room', ({ roomId }) => {
      const playerData = playerConnections.get(socket.id);
      if (playerData) {
        socket.to(roomId).emit('player-left', {
          playerAddress: playerData.playerAddress,
          message: `${playerData.playerAddress} покинул игру`
        });
      }
      socket.leave(roomId);
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log('🔌 Player disconnected:', socket.id);
      const playerData = playerConnections.get(socket.id);
      
      if (playerData) {
        socket.to(playerData.roomId).emit('player-left', {
          playerAddress: playerData.playerAddress,
          message: `${playerData.playerAddress} отключился`
        });
        playerConnections.delete(socket.id);
      }
    });

    // Ping для keep-alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`🎮 WebSocket server ready for real-time gaming!`);
    });
}); 