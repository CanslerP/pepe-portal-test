'use client'

import React, { ReactNode } from 'react'
import { ThirdwebProvider } from "thirdweb/react"
import { client, supportedChains } from '@/lib/thirdweb-config'

interface Web3ProviderProps {
  children: ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  )
} 