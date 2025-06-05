import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SHELLS_FILE = path.join(process.cwd(), 'userShells.json');

interface UserBalance {
  address: string;
  balance: number;
  lastUpdated: Date;
}

let userBalances: UserBalance[] = [];

async function loadBalances() {
  try {
    const file = await fs.readFile(SHELLS_FILE, 'utf-8');
    const parsed = JSON.parse(file);
    parsed.forEach((b: any) => {
      b.lastUpdated = new Date(b.lastUpdated);
    });
    if (Array.isArray(parsed)) {
      userBalances.splice(0, userBalances.length, ...parsed);
    }
  } catch (_) {
    // Файл не существует, создаем пустой массив
    userBalances = [];
  }
}

async function saveBalances() {
  try {
    await fs.writeFile(SHELLS_FILE, JSON.stringify(userBalances, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save balances', e);
  }
}

function getUserBalance(address: string): UserBalance {
  let user = userBalances.find(u => u.address.toLowerCase() === address.toLowerCase());
  if (!user) {
    // Новый пользователь получает стартовый баланс
    user = {
      address: address.toLowerCase(),
      balance: 1000,
      lastUpdated: new Date()
    };
    userBalances.push(user);
  }
  return user;
}

// GET - получить баланс пользователя
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    await loadBalances();
    const user = getUserBalance(address);

    return NextResponse.json({
      success: true,
      balance: user.balance,
      address: user.address
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
  }
}

// POST - обновить баланс пользователя
export async function POST(request: NextRequest) {
  try {
    const { address, amount, operation, reason } = await request.json();

    if (!address || amount === undefined || !operation) {
      return NextResponse.json({ error: 'Address, amount, and operation required' }, { status: 400 });
    }

    await loadBalances();
    const user = getUserBalance(address);

    switch (operation) {
      case 'add':
        user.balance += amount;
        break;
      case 'subtract':
        if (user.balance < amount) {
          return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }
        user.balance -= amount;
        break;
      case 'set':
        user.balance = amount;
        break;
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    user.lastUpdated = new Date();
    await saveBalances();

    console.log(`💰 ${operation.toUpperCase()} ${amount} SHELLS for ${address.slice(0, 6)}...${address.slice(-4)} | Reason: ${reason || 'No reason'} | New balance: ${user.balance}`);

    return NextResponse.json({
      success: true,
      balance: user.balance,
      operation,
      amount,
      reason
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}

// PUT - массовое обновление балансов (для выплат по играм)
export async function PUT(request: NextRequest) {
  try {
    const { transactions } = await request.json();

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Transactions array required' }, { status: 400 });
    }

    await loadBalances();
    const results = [];

    for (const transaction of transactions) {
      const { address, amount, operation, reason } = transaction;
      
      if (!address || amount === undefined || !operation) {
        continue;
      }

      const user = getUserBalance(address);
      
      switch (operation) {
        case 'add':
          user.balance += amount;
          break;
        case 'subtract':
          if (user.balance >= amount) {
            user.balance -= amount;
          } else {
            results.push({ address, error: 'Insufficient balance' });
            continue;
          }
          break;
        case 'set':
          user.balance = amount;
          break;
        default:
          results.push({ address, error: 'Invalid operation' });
          continue;
      }

      user.lastUpdated = new Date();
      results.push({ 
        address, 
        success: true, 
        newBalance: user.balance, 
        operation, 
        amount, 
        reason 
      });

      console.log(`💰 BATCH ${operation.toUpperCase()} ${amount} SHELLS for ${address.slice(0, 6)}...${address.slice(-4)} | Reason: ${reason || 'No reason'} | New balance: ${user.balance}`);
    }

    await saveBalances();

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error batch updating balances:', error);
    return NextResponse.json({ error: 'Failed to batch update balances' }, { status: 500 });
  }
} 