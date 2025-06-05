import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";

export function usePepeShells() {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const account = useActiveAccount();

  // Загрузка баланса с сервера
  const loadBalance = useCallback(async () => {
    if (!account?.address) {
      setBalance(0);
      return;
    }

    try {
      const response = await fetch(`/api/shells?address=${account.address}`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.balance);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }, [account?.address]);

  // Автоматическая загрузка баланса при подключении кошелька
  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // Автоматическое обновление баланса каждые 5 секунд (для реактивности)
  useEffect(() => {
    if (!account?.address) return;

    const interval = setInterval(loadBalance, 5000);
    return () => clearInterval(interval);
  }, [account?.address, loadBalance]);

  // Обновление баланса на сервере
  const updateBalance = async (amount: number, operation: 'add' | 'subtract' | 'set', reason?: string): Promise<boolean> => {
    if (!account?.address) return false;

    setIsLoading(true);

    try {
      const response = await fetch('/api/shells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          amount,
          operation,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setLastUpdate(new Date());
        setIsLoading(false);
        return true;
      } else {
        console.error('Balance update failed:', data.error);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Списание средств (для ставок)
  const deductShells = async (amount: number, reason?: string): Promise<boolean> => {
    if (!account?.address || balance < amount) {
      return false;
    }
    
    return await updateBalance(amount, 'subtract', reason || 'Game bet');
  };

  // Начисление средств (при выигрыше)
  const addShells = async (amount: number, reason?: string): Promise<boolean> => {
    if (!account?.address) return false;
    
    return await updateBalance(amount, 'add', reason || 'Game winnings');
  };

  // Проверка достаточности средств
  const hasEnoughShells = (amount: number): boolean => {
    return balance >= amount;
  };

  // Ежедневный бонус (можно вызывать раз в день)
  const claimDailyBonus = async (): Promise<{ success: boolean; amount?: number }> => {
    if (!account?.address) {
      return { success: false };
    }

    // Проверяем localStorage для ежедневного бонуса (клиентская проверка)
    const storageKey = `daily_bonus_${account.address}`;
    const lastClaim = localStorage.getItem(storageKey);
    const now = new Date();
    const today = now.toDateString();

    if (lastClaim === today) {
      return { success: false }; // Уже получен сегодня
    }

    const bonusAmount = 100;
    const success = await addShells(bonusAmount, 'Daily bonus');
    
    if (success) {
      localStorage.setItem(storageKey, today);
      return { success: true, amount: bonusAmount };
    }

    return { success: false };
  };

  // Принудительное обновление баланса
  const refreshBalance = async () => {
    await loadBalance();
  };

  return {
    balance,
    isLoading,
    lastUpdate,
    deductShells,
    addShells,
    hasEnoughShells,
    claimDailyBonus,
    refreshBalance,
    isConnected: !!account?.address
  };
} 