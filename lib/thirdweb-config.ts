import { createThirdwebClient, getContract } from "thirdweb"
import { ethereum, sepolia } from "thirdweb/chains"

// Client ID от thirdweb
export const client = createThirdwebClient({
  clientId: "f9837bb2f41b801d540490b80e7b2194"
})

// Поддерживаемые сети
export const supportedChains = [ethereum, sepolia]

// PEPE Token Contract (Ethereum Mainnet)
export const PEPE_TOKEN_ADDRESS = "0x6982508145454Ce325dDbE47a25d4ec3d2311933"

// Создаем контракт PEPE токена
export const pepeContract = getContract({
  client,
  chain: ethereum,
  address: PEPE_TOKEN_ADDRESS,
})

// Минимальный баланс PEPE для доступа
// В режиме разработки используем 1 PEPE, в продакшене 1000 PEPE
export const MIN_PEPE_BALANCE = process.env.NODE_ENV === 'development' ? 1 : 1000
export const PEPE_DECIMALS = 18 