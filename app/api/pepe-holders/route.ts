import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // URL страницы PEPE токена на Etherscan
    const etherscanUrl = 'https://etherscan.io/token/0x6982508145454ce325ddbe47a25d4ec3d2311933'
    
    // Получаем HTML страницы
    const response = await fetch(etherscanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    
    // Ищем информацию о холдерах
    let holdersCount = 0
    
    // Паттерны для поиска количества холдеров в HTML
    const patterns = [
      /(\d{1,3}(?:,\d{3})*)\s*(?:addresses|holders?)/gi,
      /(?:holders?|addresses)[:\s]*(\d{1,3}(?:,\d{3})*)/gi,
    ]

    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern))
      for (const match of matches) {
        const numberStr = match[1] || match[2]
        if (numberStr) {
          const count = parseInt(numberStr.replace(/,/g, ''))
          if (count > 1000 && count < 1000000000 && count > holdersCount) {
            holdersCount = count
          }
        }
      }
      if (holdersCount > 0) break
    }

    // Если не нашли, ищем любые большие числа
    if (holdersCount === 0) {
      const numberMatches = Array.from(html.matchAll(/\b(\d{1,3}(?:,\d{3})+)\b/g))
      for (const match of numberMatches) {
        const count = parseInt(match[1].replace(/,/g, ''))
        if (count > 10000 && count < 1000000 && count > holdersCount) {
          holdersCount = count
        }
      }
    }

    // Получаем текущую дату
    const currentDate = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      success: true,
      data: {
        date: currentDate,
        holdersCount: holdersCount,
        timestamp: Date.now(),
        source: 'etherscan.io'
      }
    })

  } catch (error) {
    console.error('Error fetching PEPE holders data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch holders data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 