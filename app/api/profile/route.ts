import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface UserProfile {
  address: string;
  nickname: string;
  displayName?: string;
  joinedAt: Date;
  updatedAt: Date;
  socialConnections: {
    twitter?: {
      username: string;
      verified: boolean;
      connectedAt: Date;
    };
    telegram?: {
      username: string;
      verified: boolean;
      connectedAt: Date;
    };
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalMessages: number;
    pepeShellsEarned: number;
    achievements: string[];
  };
  customization: {
    equippedAccessories: string[];
    unlockedAccessories: string[];
  };
}

const DATA_FILE = path.join(process.cwd(), 'userProfiles.json');

// Глобальное хранилище профилей
const g = globalThis as any;
if (!g.__PEPE_PORTAL_PROFILES__) {
  g.__PEPE_PORTAL_PROFILES__ = [] as UserProfile[];
}
if (!g.__PEPE_PORTAL_INITIALIZED__) {
  g.__PEPE_PORTAL_INITIALIZED__ = false;
}

let userProfiles: UserProfile[] = g.__PEPE_PORTAL_PROFILES__;
let initialized = g.__PEPE_PORTAL_INITIALIZED__;

async function loadFromDisk() {
  try {
    const file = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(file);
    
    // Преобразуем строки дат обратно в Date
    parsed.forEach((profile: any) => {
      profile.joinedAt = new Date(profile.joinedAt);
      profile.updatedAt = new Date(profile.updatedAt);
      if (profile.socialConnections?.twitter?.connectedAt) {
        profile.socialConnections.twitter.connectedAt = new Date(profile.socialConnections.twitter.connectedAt);
      }
      if (profile.socialConnections?.telegram?.connectedAt) {
        profile.socialConnections.telegram.connectedAt = new Date(profile.socialConnections.telegram.connectedAt);
      }
    });
    
    if (Array.isArray(parsed)) {
      userProfiles.splice(0, userProfiles.length, ...parsed);
    }
  } catch (e) {
    console.log('No existing profiles file, starting fresh');
  }
}

async function ensureInitialized() {
  if (!initialized) {
    await loadFromDisk();
    initialized = true;
    g.__PEPE_PORTAL_INITIALIZED__ = true;
  }
}

async function saveToDisk() {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(userProfiles, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save profiles:', e);
  }
}

// Инициализация данных будет происходить при первом запросе

// Функция для проверки уникальности никнейма
function isNicknameAvailable(nickname: string, excludeAddress?: string): boolean {
  const normalizedNickname = nickname.toLowerCase().trim();
  return !userProfiles.some(profile => 
    profile.nickname.toLowerCase() === normalizedNickname && 
    profile.address !== excludeAddress
  );
}

// Функция для создания начального профиля
function createInitialProfile(address: string): UserProfile {
  return {
    address,
    nickname: `PepeUser${Date.now().toString().slice(-6)}`,
    joinedAt: new Date(),
    updatedAt: new Date(),
    socialConnections: {},
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      totalMessages: 0,
      pepeShellsEarned: 0,
      achievements: ['first_steps']
    },
    customization: {
      equippedAccessories: [],
      unlockedAccessories: ['basic_eyes', 'basic_mouth']
    }
  };
}

// GET - получить профиль пользователя
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    let profile = userProfiles.find(p => p.address.toLowerCase() === address.toLowerCase());
    
    // Если профиль не найден, создаем новый
    if (!profile) {
      profile = createInitialProfile(address);
      userProfiles.push(profile);
      await saveToDisk();
    }

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - обновить профиль пользователя
export async function PUT(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { address, action, data } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    let profile = userProfiles.find(p => p.address.toLowerCase() === address.toLowerCase());
    
    if (!profile) {
      profile = createInitialProfile(address);
      userProfiles.push(profile);
    }

    switch (action) {
      case 'updateNickname':
        const { nickname } = data;
        
        if (!nickname || nickname.trim().length < 2) {
          return NextResponse.json(
            { success: false, error: 'Nickname must be at least 2 characters' },
            { status: 400 }
          );
        }

        if (nickname.trim().length > 20) {
          return NextResponse.json(
            { success: false, error: 'Nickname must be less than 20 characters' },
            { status: 400 }
          );
        }

        if (!isNicknameAvailable(nickname, address)) {
          return NextResponse.json(
            { success: false, error: 'Nickname is already taken' },
            { status: 400 }
          );
        }

        profile.nickname = nickname.trim();
        profile.updatedAt = new Date();
        break;

      case 'updateDisplayName':
        const { displayName } = data;
        profile.displayName = displayName?.trim() || undefined;
        profile.updatedAt = new Date();
        break;

      case 'connectSocial':
        const { platform, username } = data;
        
        if (!['twitter', 'telegram'].includes(platform)) {
          return NextResponse.json(
            { success: false, error: 'Invalid social platform' },
            { status: 400 }
          );
        }

        profile.socialConnections[platform as 'twitter' | 'telegram'] = {
          username: username.trim(),
          verified: false, // В реальном приложении здесь была бы проверка
          connectedAt: new Date()
        };
        profile.updatedAt = new Date();
        break;

      case 'disconnectSocial':
        const { platform: platformToDisconnect } = data;
        delete profile.socialConnections[platformToDisconnect as 'twitter' | 'telegram'];
        profile.updatedAt = new Date();
        break;

      case 'updateCustomization':
        const { equippedAccessories, unlockedAccessories } = data;
        if (equippedAccessories) {
          profile.customization.equippedAccessories = equippedAccessories;
        }
        if (unlockedAccessories) {
          profile.customization.unlockedAccessories = unlockedAccessories;
        }
        profile.updatedAt = new Date();
        break;

      case 'updateStats':
        const { stats } = data;
        profile.stats = { ...profile.stats, ...stats };
        profile.updatedAt = new Date();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    await saveToDisk();

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// POST - проверить доступность никнейма
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { nickname, address } = body;

    if (!nickname) {
      return NextResponse.json(
        { success: false, error: 'Nickname is required' },
        { status: 400 }
      );
    }

    const available = isNicknameAvailable(nickname, address);

    return NextResponse.json({
      success: true,
      available,
      nickname: nickname.trim()
    });
  } catch (error) {
    console.error('Error checking nickname:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check nickname' },
      { status: 500 }
    );
  }
} 