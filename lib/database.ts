import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

export interface HoldersData {
  id?: number
  date: string
  holdersCount: number
  dailyChange?: number
  timestamp: number
}

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null

// Инициализация базы данных
export async function initDatabase() {
  if (db) return db

  try {
    const dbPath = path.join(process.cwd(), 'data', 'pepe-holders.db')
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Создаем таблицу если она не существует
    await db.exec(`
      CREATE TABLE IF NOT EXISTS holders_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        holdersCount INTEGER NOT NULL,
        dailyChange INTEGER DEFAULT 0,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Получить базу данных
export async function getDatabase() {
  if (!db) {
    await initDatabase()
  }
  return db!
}

// Сохранить данные о холдерах
export async function saveHoldersData(data: Omit<HoldersData, 'id'>) {
  const database = await getDatabase()
  
  try {
    // Получаем вчерашние данные для расчета изменения
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const yesterdayData = await database.get(
      'SELECT holdersCount FROM holders_history WHERE date = ?',
      [yesterdayStr]
    )
    
    const dailyChange = yesterdayData 
      ? data.holdersCount - yesterdayData.holdersCount 
      : 0
    
    // Вставляем или обновляем данные
    await database.run(`
      INSERT OR REPLACE INTO holders_history 
      (date, holdersCount, dailyChange, timestamp) 
      VALUES (?, ?, ?, ?)
    `, [data.date, data.holdersCount, dailyChange, data.timestamp])
    
    return { ...data, dailyChange }
  } catch (error) {
    console.error('Failed to save holders data:', error)
    throw error
  }
}

// Получить данные за последние дни
export async function getHoldersHistory(days: number = 30): Promise<HoldersData[]> {
  const database = await getDatabase()
  
  try {
    const result = await database.all(`
      SELECT * FROM holders_history 
      ORDER BY date DESC 
      LIMIT ?
    `, [days])
    
    return result.reverse() // Возвращаем в хронологическом порядке
  } catch (error) {
    console.error('Failed to get holders history:', error)
    throw error
  }
}

// Получить последние данные
export async function getLatestHoldersData(): Promise<HoldersData | null> {
  const database = await getDatabase()
  
  try {
    const result = await database.get(`
      SELECT * FROM holders_history 
      ORDER BY date DESC 
      LIMIT 1
    `)
    
    return result || null
  } catch (error) {
    console.error('Failed to get latest holders data:', error)
    throw error
  }
}

// Получить статистику
export async function getHoldersStats() {
  const database = await getDatabase()
  
  try {
    const stats = await database.all(`
      SELECT 
        COUNT(*) as totalRecords,
        MIN(holdersCount) as minHolders,
        MAX(holdersCount) as maxHolders,
        AVG(holdersCount) as avgHolders,
        SUM(CASE WHEN dailyChange > 0 THEN dailyChange ELSE 0 END) as totalGrowth,
        MIN(date) as firstDate,
        MAX(date) as lastDate
      FROM holders_history
    `)
    
    return stats[0]
  } catch (error) {
    console.error('Failed to get holders stats:', error)
    throw error
  }
} 