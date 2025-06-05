import { NextRequest, NextResponse } from 'next/server'
import { 
  saveHoldersData, 
  getHoldersHistory, 
  getLatestHoldersData, 
  getHoldersStats,
  initDatabase 
} from '@/lib/database'

// Инициализируем БД при первом запросе
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase()
    dbInitialized = true
  }
}

// GET - получить исторические данные
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const days = parseInt(searchParams.get('days') || '30')

    switch (action) {
      case 'latest':
        const latestData = await getLatestHoldersData()
        return NextResponse.json({
          success: true,
          data: latestData
        })

      case 'stats':
        const stats = await getHoldersStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'history':
      default:
        const history = await getHoldersHistory(days)
        return NextResponse.json({
          success: true,
          data: history
        })
    }

  } catch (error) {
    console.error('Error getting holders data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get holders data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - сохранить новые данные
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const body = await request.json()
    const { date, holdersCount, timestamp } = body

    if (!date || !holdersCount || !timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: date, holdersCount, timestamp'
      }, { status: 400 })
    }

    const savedData = await saveHoldersData({
      date,
      holdersCount,
      timestamp
    })

    return NextResponse.json({
      success: true,
      data: savedData
    })

  } catch (error) {
    console.error('Error saving holders data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save holders data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 