import cron from 'node-cron'
import axios from 'axios'

// Функция для автоматического обновления данных о холдерах
async function updateHoldersData() {
  try {
    console.log('🕐 Starting scheduled holders data update...')
    
    // Вызываем наш API endpoint для обновления данных
    const response = await axios.post(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/update-holders`)
    
    if (response.data.success) {
      console.log('✅ Scheduled holders data update completed successfully:', response.data.data)
    } else {
      console.error('❌ Scheduled holders data update failed:', response.data.error)
    }
  } catch (error) {
    console.error('❌ Error during scheduled holders data update:', error)
  }
}

// Настраиваем cron jobs
export function initScheduler() {
  // Обновляем данные каждый день в 9:00 утра
  cron.schedule('0 9 * * *', updateHoldersData, {
    timezone: "Europe/Moscow"
  })
  
  // Также можно добавить обновление каждые 6 часов для более частого мониторинга
  cron.schedule('0 */6 * * *', updateHoldersData, {
    timezone: "Europe/Moscow"
  })
  
  console.log('📅 Scheduler initialized:')
  console.log('   - Daily update at 9:00 AM Moscow time')
  console.log('   - Additional updates every 6 hours')
}

// Функция для запуска планировщика в development режиме
export function startScheduler() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: scheduler enabled')
    initScheduler()
    
    // В режиме разработки делаем первоначальное обновление сразу
    setTimeout(() => {
      console.log('🚀 Running initial holders data update...')
      updateHoldersData()
    }, 5000) // Ждем 5 секунд для инициализации сервера
  } else {
    console.log('🏭 Production mode: scheduler enabled')
    initScheduler()
  }
} 