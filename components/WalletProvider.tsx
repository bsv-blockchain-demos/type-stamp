'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getIdentityKey, isWalletAvailable } from '@/lib/wallet'

interface WalletContextType {
  identityKey: string | null
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  identityKey: null,
  isConnected: false,
  isLoading: true,
  connect: async () => {},
})

export function useWallet() {
  return useContext(WalletContext)
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [identityKey, setIdentityKey] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const connect = useCallback(async () => {
    try {
      setIsLoading(true)
      const available = await isWalletAvailable()
      if (!available) {
        throw new Error('Wallet not available')
      }
      const key = await getIdentityKey()
      setIdentityKey(key)
      setIsConnected(true)
    } catch (err) {
      console.error('Wallet connection failed:', err)
      setIsConnected(false)
      setIdentityKey(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-connect attempt on mount
  useEffect(() => {
    connect().catch(() => {
      setIsLoading(false)
    })
  }, [connect])

  return (
    <WalletContext.Provider value={{ identityKey, isConnected, isLoading, connect }}>
      {children}
    </WalletContext.Provider>
  )
}
