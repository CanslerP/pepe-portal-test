import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";

export interface UserProfile {
  address: string;
  nickname: string;
  displayName?: string;
  joinedAt: Date;
  updatedAt: Date;
  socialConnections: {
    twitter?: {
      username: string;
      verified: boolean;
      connectedAt: Date;
    };
    telegram?: {
      username: string;
      verified: boolean;
      connectedAt: Date;
    };
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalMessages: number;
    pepeShellsEarned: number;
    achievements: string[];
  };
  customization: {
    equippedAccessories: string[];
    unlockedAccessories: string[];
  };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();

  // Загрузка профиля
  const loadProfile = useCallback(async (address?: string) => {
    const targetAddress = address || account?.address;
    if (!targetAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile?address=${targetAddress}`);
      const data = await response.json();

      if (data.success) {
        // Преобразуем даты
        const profileData = {
          ...data.profile,
          joinedAt: new Date(data.profile.joinedAt),
          updatedAt: new Date(data.profile.updatedAt),
          socialConnections: {
            ...data.profile.socialConnections,
            ...(data.profile.socialConnections.twitter && {
              twitter: {
                ...data.profile.socialConnections.twitter,
                connectedAt: new Date(data.profile.socialConnections.twitter.connectedAt)
              }
            }),
            ...(data.profile.socialConnections.telegram && {
              telegram: {
                ...data.profile.socialConnections.telegram,
                connectedAt: new Date(data.profile.socialConnections.telegram.connectedAt)
              }
            })
          }
        };
        setProfile(profileData);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Обновление никнейма
  const updateNickname = useCallback(async (nickname: string): Promise<boolean> => {
    if (!account?.address) {
      setError('No wallet connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          action: 'updateNickname',
          data: { nickname }
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadProfile();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError('Failed to update nickname');
      console.error('Error updating nickname:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, loadProfile]);

  // Проверка доступности никнейма
  const checkNicknameAvailability = useCallback(async (nickname: string): Promise<boolean> => {
    if (!nickname.trim()) return false;

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          address: account?.address
        })
      });

      const data = await response.json();
      return data.success ? data.available : false;
    } catch (err) {
      console.error('Error checking nickname availability:', err);
      return false;
    }
  }, [account]);

  // Подключение социальной сети
  const connectSocial = useCallback(async (platform: 'twitter' | 'telegram', username: string): Promise<boolean> => {
    if (!account?.address) {
      setError('No wallet connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          action: 'connectSocial',
          data: { platform, username }
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadProfile();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError(`Failed to connect ${platform}`);
      console.error(`Error connecting ${platform}:`, err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, loadProfile]);

  // Отключение социальной сети
  const disconnectSocial = useCallback(async (platform: 'twitter' | 'telegram'): Promise<boolean> => {
    if (!account?.address) {
      setError('No wallet connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          action: 'disconnectSocial',
          data: { platform }
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadProfile();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError(`Failed to disconnect ${platform}`);
      console.error(`Error disconnecting ${platform}:`, err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, loadProfile]);

  // Обновление кастомизации
  const updateCustomization = useCallback(async (customization: {
    equippedAccessories?: string[];
    unlockedAccessories?: string[];
  }): Promise<boolean> => {
    if (!account?.address) {
      setError('No wallet connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          action: 'updateCustomization',
          data: customization
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadProfile();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError('Failed to update customization');
      console.error('Error updating customization:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, loadProfile]);

  // Загружаем профиль при подключении кошелька
  useEffect(() => {
    if (account?.address) {
      loadProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [account?.address, loadProfile]);

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateNickname,
    checkNicknameAvailability,
    connectSocial,
    disconnectSocial,
    updateCustomization,
    clearError: () => setError(null)
  };
} 