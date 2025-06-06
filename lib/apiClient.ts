interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private requestQueue: Map<string, Promise<any>> = new Map();
  private retryCount: Map<string, number> = new Map();

  async request<T = any>(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 5000,
      onRetry
    } = retryOptions;

    const requestKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.body || {})}`;
    
    // Проверяем, есть ли уже такой запрос в очереди
    if (this.requestQueue.has(requestKey)) {
      console.log('⏳ Request already in queue, waiting...', requestKey);
      return this.requestQueue.get(requestKey);
    }

    const requestPromise = this.executeRequest<T>(url, options, maxRetries, baseDelay, maxDelay, onRetry, requestKey);
    
    // Добавляем в очередь
    this.requestQueue.set(requestKey, requestPromise);
    
    // Удаляем из очереди после завершения
    requestPromise.finally(() => {
      this.requestQueue.delete(requestKey);
      this.retryCount.delete(requestKey);
    });

    return requestPromise;
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    maxRetries: number,
    baseDelay: number,
    maxDelay: number,
    onRetry: ((attempt: number, error: any) => void) | undefined,
    requestKey: string
  ): Promise<ApiResponse<T>> {
    let lastError: any;
    const currentRetries = this.retryCount.get(requestKey) || 0;

    for (let attempt = currentRetries; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 API Request attempt ${attempt + 1}/${maxRetries + 1}:`, url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ API Success:`, { url, status: response.status });
          return {
            success: true,
            data: data,
            status: response.status
          };
        } else {
          // Для некоторых ошибок не нужно повторять запрос
          if (response.status === 404 || response.status === 403 || response.status === 422) {
            console.log(`❌ API Error (no retry):`, { url, status: response.status, data });
            return {
              success: false,
              error: data.error || `HTTP ${response.status}`,
              status: response.status
            };
          }
          
          throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ API Attempt ${attempt + 1} failed:`, { url, error: error.message });
        
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`⏰ Retrying in ${delay}ms...`);
          
          this.retryCount.set(requestKey, attempt + 1);
          
          if (onRetry) {
            onRetry(attempt + 1, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`💥 API Request failed after ${maxRetries + 1} attempts:`, { url, error: lastError });
    return {
      success: false,
      error: lastError?.message || 'Network error',
      status: 0
    };
  }

  // Специальные методы для игровых действий
  async gameAction(roomId: string, action: any): Promise<ApiResponse> {
    return this.request(`/api/game-rooms/${roomId}`, {
      method: 'POST',
      body: JSON.stringify(action)
    }, {
      maxRetries: 2, // Меньше попыток для игровых действий
      baseDelay: 500,
      onRetry: (attempt, error) => {
        console.log(`🎮 Retrying game action (${attempt}):`, action.action);
      }
    });
  }

  async getGameRoom(roomId: string): Promise<ApiResponse> {
    return this.request(`/api/game-rooms/room?id=${roomId}`, {
      method: 'GET'
    }, {
      maxRetries: 3,
      baseDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(`🔄 Retrying get game room (${attempt}):`, roomId);
      }
    });
  }

  async updateGameStatus(roomId: string, updates: any): Promise<ApiResponse> {
    return this.request('/api/game-rooms', {
      method: 'PUT',
      body: JSON.stringify({ roomId, ...updates })
    }, {
      maxRetries: 2,
      baseDelay: 500
    });
  }
}

// Экспортируем singleton instance
export const apiClient = new ApiClient();

// Типы для использования
export type { ApiResponse, RetryOptions }; 