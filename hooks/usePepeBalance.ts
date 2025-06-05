import { useActiveAccount } from "thirdweb/react"
import { useReadContract } from "thirdweb/react"
import { balanceOf } from "thirdweb/extensions/erc20"
import { pepeContract, MIN_PEPE_BALANCE, PEPE_DECIMALS } from '@/lib/thirdweb-config'
import { toEther } from "thirdweb/utils"

export function usePepeBalance() {
  const account = useActiveAccount()
  const isConnected = !!account

  // Читаем баланс PEPE токенов
  const { 
    data: balance, 
    isLoading, 
    error, 
    refetch 
  } = useReadContract(
    balanceOf, 
    {
      contract: pepeContract,
      address: account?.address || "",
      queryOptions: {
        enabled: !!account?.address,
        refetchInterval: 30000, // Обновляем каждые 30 секунд
      }
    }
  )

  // Форматируем баланс из wei в читаемый формат
  const formattedBalance = balance 
    ? parseFloat(toEther(balance))
    : 0

  // Проверяем, есть ли достаточно PEPE для доступа
  const hasEnoughPepe = formattedBalance >= MIN_PEPE_BALANCE

  // Сколько PEPE нужно еще для доступа
  const neededPepe = hasEnoughPepe 
    ? 0 
    : MIN_PEPE_BALANCE - formattedBalance

  return {
    balance: formattedBalance,
    hasEnoughPepe,
    neededPepe,
    isLoading,
    error,
    refetch,
    isConnected,
    address: account?.address
  }
} 