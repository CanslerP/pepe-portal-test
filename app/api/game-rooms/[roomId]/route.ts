import { NextRequest, NextResponse } from 'next/server';
import { getGameRooms, updateGameRoom } from '../route';

// Типы для крестиков-ноликов
type CellType = 'X' | 'O' | null;

interface TicTacToeMove {
  player: 'X' | 'O';
  position: { row: number; col: number };
  moveNumber: number;
  timestamp: Date;
}

interface TicTacToeGameState {
  board: CellType[][];
  currentPlayer: 'X' | 'O';
  moveHistory: TicTacToeMove[];
  moveNumber: number;
  gameStatus: 'playing' | 'finished';
  winner?: 'X' | 'O';
  messages: Array<{
    id: string;
    player: string;
    playerName: string;
    message: string;
    timestamp: Date;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const gameRooms = await getGameRooms();
    const roomId = params.roomId;
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

// Функция обработки выплат при победе в крестики-нолики (асинхронная)
function handleTicTacToeWinnings(room: any, winner: 'X' | 'O') {
  // Запускаем асинхронно, не ждем результата для ускорения ответа
  const winnerAddress = winner === 'X' ? room.creator : room.opponent;
  const betAmount = room.betAmount;
  const winnings = betAmount * 2;
  
  // Асинхронная обработка выплат - не блокируем игровой процесс
  setTimeout(async () => {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: winnerAddress,
          amount: winnings,
          operation: 'add',
          reason: `Won tic-tac-toe game - prize ${winnings} SHELLS`
        })
      });

      if (!response.ok) {
        console.error('Failed to process winnings for tic-tac-toe game');
      }
    } catch (error) {
      console.error('Error processing tic-tac-toe winnings:', error);
    }
  }, 100); // Небольшая задержка для обработки в фоне
}

// Функция проверки победы (ничьи больше не существует)
function checkWin(board: CellType[][]): 'X' | 'O' | null {
  // Проверяем горизонтали
  for (let row = 0; row < 3; row++) {
    if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
      return board[row][0];
    }
  }

  // Проверяем вертикали
  for (let col = 0; col < 3; col++) {
    if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
      return board[0][col];
    }
  }

  // Проверяем диагонали
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }

  // Ничьи больше не существует - игра продолжается до победы
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const gameRooms = await getGameRooms();
    const roomId = params.roomId;
    const body = await request.json();
    const { action, player, move } = body;
    
    const room = gameRooms.find(r => r.id === roomId);
    if (!room) {
      return NextResponse.json({ error: 'Game room not found' }, { status: 404 });
    }

    switch (action) {
      case 'makeMoveTicTacToe': {
        // Проверяем, что это игра крестики-нолики
        if (room.gameType !== 'tictactoe') {
          return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
        }

        // Проверяем, что игра начата
        if (room.status !== 'playing') {
          return NextResponse.json({ error: 'Game is not in playing state' }, { status: 400 });
        }

        // Определяем символ игрока
        const playerSymbol = room.creator === player ? 'X' : 'O';
        
        // Инициализируем игровое состояние если его нет
        if (!room.gameState) {
          room.gameState = {
            board: Array(3).fill(null).map(() => Array(3).fill(null)),
            currentPlayer: 'X',
            moveHistory: [],
            moveNumber: 0,
            gameStatus: 'playing',
            messages: []
          } as any;
        }

        const gameState = room.gameState as any as TicTacToeGameState;

        // Проверяем очередность
        if (gameState.currentPlayer !== playerSymbol) {
          return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
        }

        // Проверяем, что клетка свободна
        if (gameState.board[move.row][move.col] !== null) {
          return NextResponse.json({ error: 'Cell is already occupied' }, { status: 400 });
        }

        let undoMove = null;

        // 🔄 НОВАЯ МЕХАНИКА: Проверяем количество символов на доске
        const symbolsOnBoard = gameState.board.flat().filter(cell => cell !== null).length;
        
        if (symbolsOnBoard >= 6) {
          // Удаляем самый первый (старейший) ход
          const firstMove = gameState.moveHistory.shift();
          if (firstMove) {
            // Очищаем клетку на доске
            gameState.board[firstMove.position.row][firstMove.position.col] = null;
            
            undoMove = firstMove;
            console.log(`🔄 Board full (6+ symbols)! Removed oldest move by ${firstMove.player} at (${firstMove.position.row},${firstMove.position.col})`);
          }
        }

        // Делаем новый ход
        gameState.board[move.row][move.col] = playerSymbol;
        gameState.moveNumber++;

        // Записываем ход в историю
        const newMove: TicTacToeMove = {
          player: playerSymbol,
          position: { row: move.row, col: move.col },
          moveNumber: gameState.moveNumber,
          timestamp: new Date()
        };
        gameState.moveHistory.push(newMove);

        // Смена игрока
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

        // Проверяем победу
        const winner = checkWin(gameState.board);
        if (winner) {
          gameState.gameStatus = 'finished';
          gameState.winner = winner;
          room.status = 'finished';
          room.winner = winner === 'X' ? room.creator : room.opponent;
          
          // Обрабатываем выплаты асинхронно (не блокируем ответ)
          handleTicTacToeWinnings(room, winner);
        }

        // Сохраняем изменения
        await updateGameRoom(roomId, room);

        return NextResponse.json({ 
          success: true, 
          gameState,
          undoMove: undoMove
        });
      }

      case 'surrender': {
        await updateGameRoom(roomId, { 
          status: 'finished', 
          updatedAt: new Date() 
        });

        return NextResponse.json({ success: true });
      }

      case 'resetGame': {
        if (room.gameType === 'tictactoe') {
          const newGameState: TicTacToeGameState = {
            board: Array(3).fill(null).map(() => Array(3).fill(null)),
            currentPlayer: 'X',
            moveHistory: [],
            moveNumber: 0,
            gameStatus: 'playing',
            messages: room.gameState?.messages || []
          };
          
          await updateGameRoom(roomId, { 
            gameState: newGameState as any,
            status: 'playing',
            winner: undefined,
            updatedAt: new Date() 
          });
          
          return NextResponse.json({ success: true, gameState: newGameState });
        }
        return NextResponse.json({ error: 'Reset not supported for this game type' }, { status: 400 });
      }

      case 'requestNewGame': {
        if (room.gameType !== 'tictactoe') {
          return NextResponse.json({ error: 'New game requests only supported for tic-tac-toe' }, { status: 400 });
        }
        
        if (room.status !== 'finished') {
          return NextResponse.json({ error: 'Game must be finished to request new game' }, { status: 400 });
        }

        // Сохраняем запрос в gameState с новой ставкой
        const gameState = room.gameState as any;
        if (!gameState) {
          return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
        }
        
        const { betAmount } = body;
        gameState.newGameRequest = player;
        gameState.newGameBet = betAmount || room.betAmount; // Новая ставка или старая
        gameState.declineNotification = null; // Очищаем предыдущие уведомления
        
        await updateGameRoom(roomId, { gameState: gameState as any, updatedAt: new Date() });
        
        return NextResponse.json({ success: true, message: 'New game requested' });
      }

      case 'confirmNewGame': {
        if (room.gameType !== 'tictactoe') {
          return NextResponse.json({ error: 'New game confirmation only supported for tic-tac-toe' }, { status: 400 });
        }

        const gameState = room.gameState as any;
        if (!gameState?.newGameRequest) {
          return NextResponse.json({ error: 'No new game request found' }, { status: 400 });
        }

        if (gameState.newGameRequest === player) {
          return NextResponse.json({ error: 'Cannot confirm your own request' }, { status: 400 });
        }

        // Используем новую ставку или текущую
        const newBetAmount = gameState.newGameBet || room.betAmount;
        const requesterAddress = gameState.newGameRequest;

        // Списываем ставку с запросившего новую игру
        const shellsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shells`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: requesterAddress,
            amount: newBetAmount,
            operation: 'subtract',
            reason: 'New tic-tac-toe game bet'
          })
        });

        if (!shellsResponse.ok) {
          return NextResponse.json({ error: 'Failed to deduct bet from requester' }, { status: 400 });
        }

        // Создаём новую игру с новой ставкой
        const newGameState: TicTacToeGameState = {
          board: Array(3).fill(null).map(() => Array(3).fill(null)),
          currentPlayer: 'X',
          moveHistory: [],
          moveNumber: 0,
          gameStatus: 'playing',
          messages: []
        };
        
        await updateGameRoom(roomId, { 
          gameState: newGameState as any,
          betAmount: newBetAmount, // Обновляем ставку в игровой комнате
          status: 'playing',
          winner: undefined,
          updatedAt: new Date() 
        });
        
        return NextResponse.json({ success: true, gameState: newGameState });
      }

      case 'declineNewGame': {
        if (room.gameType !== 'tictactoe') {
          return NextResponse.json({ error: 'New game decline only supported for tic-tac-toe' }, { status: 400 });
        }

        const gameState = room.gameState as any;
        if (!gameState?.newGameRequest) {
          return NextResponse.json({ error: 'No new game request found' }, { status: 400 });
        }

        const requesterAddress = gameState.newGameRequest;

        // Сохраняем уведомление для запросившего игрока
        gameState.declineNotification = requesterAddress;
        gameState.newGameRequest = null;
        gameState.newGameBet = null;
        
        await updateGameRoom(roomId, { gameState: gameState as any, updatedAt: new Date() });
        
        // Очищаем уведомление через 10 секунд
        setTimeout(async () => {
          try {
            const currentGameState = gameState;
            if (currentGameState.declineNotification === requesterAddress) {
              currentGameState.declineNotification = null;
              await updateGameRoom(roomId, { gameState: currentGameState as any, updatedAt: new Date() });
            }
          } catch (error) {
            console.error('Error clearing decline notification:', error);
          }
        }, 10000);
        
        return NextResponse.json({ success: true, message: 'New game request declined' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling game action:', error);
    return NextResponse.json({ error: 'Failed to process game action' }, { status: 500 });
  }
} 