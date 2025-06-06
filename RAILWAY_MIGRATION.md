# 🚀 Миграция с Vercel на Railway

## 🎯 Зачем переходить на Railway?

### ❌ Проблемы с Vercel:
- 🚫 **WebSocket не поддерживается** в Serverless Functions
- ⏰ **Timeout ошибки** (10-60 сек лимит)
- 🥶 **Cold starts** замедляют игры  
- 💾 **Нет persistent storage** для game state
- 💰 **Дороже** для полноценных игр

### ✅ Преимущества Railway:
- 🔌 **Полная поддержка WebSocket** и Socket.IO
- ♾️ **Нет timeout ограничений** для игр
- 🔥 **Always-on containers** (нет cold starts)
- 🗄️ **Встроенная PostgreSQL/Redis**
- 💰 **$5/месяц** за все включенное

## 🛠️ Пошаговая миграция

### 1. 📝 Создайте аккаунт Railway
```bash
# Перейдите на https://railway.app
# Зарегистрируйтесь через GitHub
```

### 2. 🔧 Установите Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 3. 🗂️ Подготовьте проект
```bash
# Клонируйте ваш репозиторий
git clone https://github.com/graitech-lab/pepe-portal-test.git
cd pepe-portal-test

# Установите новые зависимости
npm install socket.io
```

### 4. 🚀 Деплой на Railway
```bash
# Инициализируйте Railway проект
railway init

# Выберите "Deploy from GitHub repo"
# Подключите ваш репозиторий

# Первый деплой
railway up
```

### 5. 🗄️ Настройте базу данных (опционально)
```bash
# Добавьте PostgreSQL
railway add postgresql

# Добавьте Redis для кэширования
railway add redis

# Получите connection strings
railway variables
```

### 6. 🌍 Настройте environment variables
```bash
# В Railway Dashboard или через CLI:
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=your_postgres_url
railway variables set REDIS_URL=your_redis_url
```

### 7. 🔄 Обновите код для Socket.IO

**Замените в TicTacToeGame.tsx:**
```typescript
// Старый код (polling):
import { apiClient } from '@/lib/apiClient';

// Новый код (Socket.IO):
import { useSocketIO } from '@/hooks/useSocketIO';

// Используйте useSocketIO вместо polling:
const { 
  isConnected, 
  gameState, 
  sendGameAction 
} = useSocketIO({
  roomId: gameRoom?.id || '',
  onGameUpdate: (data) => {
    // Мгновенные обновления!
    setBoard(data.gameState.board);
    // ... обновляем UI
  }
});

// Отправка ходов:
const makeMove = (row: number, col: number) => {
  sendGameAction({
    action: 'makeMoveTicTacToe',
    move: { row, col }
  });
};
```

## 🔧 Конфигурация для Railway

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### package.json (обновленные скрипты)
```json
{
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js",
    "build": "next build"
  }
}
```

## 🎮 Результат миграции

### ⚡ Мгновенные обновления
- Ходы синхронизируются **мгновенно** через WebSocket
- Нет 404 ошибок от polling запросов
- Видно когда оппонент подключился/отключился

### 🛡️ Стабильность
- Нет timeout ошибок
- Persistent connections
- Автоматическое переподключение

### 💰 Экономия
- Railway: **$5/месяц** (все включено)
- Vercel Pro: **$20/месяц** + отдельно база данных

## 🔄 Откат на Vercel (если нужен)

Чтобы вернуться на Vercel, просто измените package.json:
```json
{
  "scripts": {
    "dev": "next dev",
    "start": "next start",
    "build": "next build"
  }
}
```

И задеплойте на Vercel как обычно.

## ❓ Поддержка

При возникновении проблем:
1. Проверьте логи: `railway logs`
2. Проверьте переменные: `railway variables`  
3. Restart: `railway up --detach`

**Railway документация:** https://docs.railway.app/ 