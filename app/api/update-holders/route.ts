import { NextRequest, NextResponse } from 'next/server'
import { saveHoldersData, initDatabase } from '@/lib/database'

// Инициализируем БД при первом запросе
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase()
    dbInitialized = true
  }
}

// Функция для парсинга данных с Etherscan
async function fetchHoldersFromEtherscan(): Promise<number> {
  const etherscanUrl = 'https://etherscan.io/token/0x6982508145454ce325ddbe47a25d4ec3d2311933'
  
  const response = await fetch(etherscanUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    signal: AbortSignal.timeout(10000) // 10 секунд таймаут
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const html = await response.text()
  let holdersCount = 0
  
  // Паттерны для поиска количества холдеров в HTML
  const patterns = [
    // Поиск числа перед словом "addresses" или "holders"
    /(\d{1,3}(?:,\d{3})*)\s*(?:addresses|holders?)/gi,
    // Поиск в обратном порядке
    /(?:holders?|addresses)[:\s]*(\d{1,3}(?:,\d{3})*)/gi,
    // Поиск в meta тегах или data атрибутах
    /data-holders["\s]*=[\s"]*(\d{1,3}(?:,\d{3})*)/gi,
    // Поиск в JSON структурах
    /"holders?["\s]*:["\s]*(\d{1,3}(?:,\d{3})*)/gi
  ]
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      const numberStr = match[1] || match[2] // В зависимости от паттерна
      if (numberStr) {
        const count = parseInt(numberStr.replace(/,/g, ''))
        // Фильтруем только разумные числа (больше 1000, но меньше 1 миллиарда)
        if (count > 1000 && count < 1000000000 && count > holdersCount) {
          holdersCount = count
        }
      }
    }
    if (holdersCount > 0) break
  }

  // Если не нашли через паттерны, ищем любые большие числа в HTML
  if (holdersCount === 0) {
    const numberMatches = Array.from(html.matchAll(/\b(\d{1,3}(?:,\d{3})+)\b/g))
    for (const match of numberMatches) {
      const count = parseInt(match[1].replace(/,/g, ''))
      // Берем самое большое число в разумном диапазоне
      if (count > 10000 && count < 1000000 && count > holdersCount) {
        holdersCount = count
      }
    }
  }

  return holdersCount
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    console.log('🔄 Starting holders data update...')
    
    // Получаем данные с Etherscan
    const holdersCount = await fetchHoldersFromEtherscan()
    
    if (holdersCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse holders count from Etherscan'
      }, { status: 400 })
    }

    // Сохраняем в базу данных
    const currentDate = new Date().toISOString().split('T')[0]
    const timestamp = Date.now()
    
    const savedData = await saveHoldersData({
      date: currentDate,
      holdersCount,
      timestamp
    })

    console.log('✅ Holders data updated successfully:', savedData)

    return NextResponse.json({
      success: true,
      message: 'Holders data updated successfully',
      data: savedData
    })

  } catch (error) {
    console.error('❌ Error updating holders data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update holders data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET метод для ручного запуска обновления
export async function GET(request: NextRequest) {
  // Переадресуем на POST метод
  return POST(request)
} 