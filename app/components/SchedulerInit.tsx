'use client'

import { useEffect } from 'react'

// Этот компонент инициализирует планировщик только на клиенте
export default function SchedulerInit() {
  useEffect(() => {
    // Инициализируем планировщик только на клиенте для избежания SSR проблем
    const initScheduler = async () => {
      try {
        // Делаем первоначальное обновление данных при загрузке приложения
        const response = await fetch('/api/update-holders', {
          method: 'POST'
        })
        
        if (response.ok) {
          console.log('✅ Initial holders data update completed')
        } else {
          console.log('⚠️ Initial holders data update failed, but continuing...')
        }
      } catch (error) {
        console.log('⚠️ Could not perform initial holders update:', error)
      }
    }

    // Запускаем инициализацию через 2 секунды после загрузки
    const timer = setTimeout(initScheduler, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  // Этот компонент ничего не рендерит
  return null
} 