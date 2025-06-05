import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Типы для игровых комнат (копируем из useGameRooms)
interface ChatMessage {
  id: string;
  player: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

interface GameState {
  board: (string | null)[][];
  currentPlayer: 'black' | 'white';
  blackCaptures: number;
  whiteCaptures: number;
  moves: Array<{
    player: 'black' | 'white';
    row: number;
    col: number;
    timestamp: Date;
  }>;
  gameStatus: 'playing' | 'finished';
  winner?: string;
  messages: ChatMessage[];
}

interface GameRoom {
  id: string;
  creator: string;
  creatorName: string;
  betAmount: number;
  gameType: 'go' | 'chess' | 'tictactoe';
  status: 'waiting' | 'playing' | 'finished';
  opponent?: string;
  opponentName?: string;
  createdAt: Date;
  updatedAt?: Date;
  winner?: string;
  gameState?: GameState;
}

// Глобальное хранилище в памяти (сохраняется между hot-reload в dev-режиме)
const g = globalThis as any;
if (!g.__PEPE_PORTAL_GAME_ROOMS__) {
  g.__PEPE_PORTAL_GAME_ROOMS__ = [] as GameRoom[];
}
if (!g.__PEPE_PORTAL_GAME_ROOMS_INITIALIZED__) {
  g.__PEPE_PORTAL_GAME_ROOMS_INITIALIZED__ = false;
}

let gameRooms: GameRoom[] = g.__PEPE_PORTAL_GAME_ROOMS__;
let initialized = g.__PEPE_PORTAL_GAME_ROOMS_INITIALIZED__;

const DATA_FILE = path.join(process.cwd(), 'gameRooms.json');

async function loadFromDisk() {
  try {
    const file = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(file);
    // Преобразуем строки дат обратно в Date
    parsed.forEach((r: any) => {
      r.createdAt = new Date(r.createdAt);
      if (r.updatedAt) r.updatedAt = new Date(r.updatedAt);
    });
    if (Array.isArray(parsed)) {
      gameRooms.splice(0, gameRooms.length, ...parsed);
    }
  } catch (e) {
    // Файл может отсутствовать при первом запуске – это нормально
  }
}

// Оптимизированная запись на диск (реже, чем каждый ход)
let saveTimeout: NodeJS.Timeout | null = null;
let saveInProgress = false;

async function saveToDisk() {
  try {
    if (saveInProgress) return; // Предотвращаем одновременные записи
    saveInProgress = true;
    
    // Записываем без циклических структур
    await fs.writeFile(DATA_FILE, JSON.stringify(gameRooms, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save game rooms:', e);
  } finally {
    saveInProgress = false;
  }
}

// Отложенная запись - не блокирует игровой процесс
function deferredSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Сохраняем через 2 секунды после последнего изменения
  saveTimeout = setTimeout(async () => {
    await saveToDisk();
    saveTimeout = null;
  }, 2000);
}

async function ensureInitialized() {
  if (!initialized) {
    await loadFromDisk();
    initialized = true;
    g.__PEPE_PORTAL_GAME_ROOMS_INITIALIZED__ = true;
  }
}

// Экспортируем функции для доступа к данным
export async function getGameRooms() {
  await ensureInitialized();
  return gameRooms;
}

export async function addGameRoom(room: GameRoom) {
  await ensureInitialized();
  gameRooms.push(room);
  deferredSave(); // Быстрая отложенная запись
}

export async function updateGameRoom(roomId: string, updates: Partial<GameRoom>) {
  await ensureInitialized();
  const roomIndex = gameRooms.findIndex(r => r.id === roomId);
  if (roomIndex !== -1) {
    Object.assign(gameRooms[roomIndex], updates);
    deferredSave(); // Быстрая отложенная запись вместо блокирующей
    return gameRooms[roomIndex];
  }
  return null;
}

export async function removeGameRoom(roomId: string) {
  await ensureInitialized();
  const roomIndex = gameRooms.findIndex(r => r.id === roomId);
  if (roomIndex !== -1) {
    const removed = gameRooms.splice(roomIndex, 1)[0];
    deferredSave(); // Быстрая отложенная запись
    return removed;
  }
  return null;
}

// Очистка старых игр (старше 24 часов)
function cleanupOldGames() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (let i = gameRooms.length - 1; i >= 0; i--) {
    const room = gameRooms[i];
    if (room.createdAt <= oneDayAgo && room.status !== 'playing') {
      gameRooms.splice(i, 1);
    }
  }
}

// GET - получить все игровые комнаты
export async function GET() {
  try {
    await ensureInitialized();
    cleanupOldGames();
    // Убираем частое логирование для оптимизации производительности
    
    return NextResponse.json({
      success: true,
      rooms: gameRooms
    });
  } catch (error) {
    console.error('Error fetching game rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game rooms' },
      { status: 500 }
    );
  }
}

// POST - создать новую игровую комнату
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { creator, creatorName, betAmount, gameType } = body;

    if (!creator || !creatorName || !betAmount || !gameType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRoom: GameRoom = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creator,
      creatorName,
      betAmount,
      gameType,
      status: 'waiting',
      createdAt: new Date()
    };

    gameRooms.push(newRoom);
    deferredSave(); // Быстрая отложенная запись

    return NextResponse.json({
      success: true,
      room: newRoom
    });
  } catch (error) {
    console.error('Error creating game room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game room' },
      { status: 500 }
    );
  }
}

// PUT - обновить игровую комнату (присоединиться к игре, изменить статус)
export async function PUT(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { roomId, action, playerAddress, playerName, status, winner } = body;

    const roomIndex = gameRooms.findIndex(room => room.id === roomId);
    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Game room not found' },
        { status: 404 }
      );
    }

    const room = gameRooms[roomIndex];

    if (action === 'join') {
      if (room.status !== 'waiting') {
        return NextResponse.json(
          { success: false, error: 'Game room is not available for joining' },
          { status: 400 }
        );
      }

      room.opponent = playerAddress;
      room.opponentName = playerName;
      room.status = 'playing';
    } else if (action === 'updateStatus') {
      room.status = status;
      if (winner) {
        room.winner = winner;
      }
    }

    deferredSave(); // Быстрая отложенная запись
    return NextResponse.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Error updating game room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update game room' },
      { status: 500 }
    );
  }
}

// DELETE - удалить игровую комнату
export async function DELETE(request: NextRequest) {
  try {
    await ensureInitialized();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const roomIndex = gameRooms.findIndex(room => room.id === roomId);
    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Game room not found' },
        { status: 404 }
      );
    }

    gameRooms.splice(roomIndex, 1);
    deferredSave(); // Быстрая отложенная запись

    return NextResponse.json({
      success: true,
      message: 'Game room deleted'
    });
  } catch (error) {
          console.error('Error deleting game room:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete game room' },
        { status: 500 }
      );
    }
  } 