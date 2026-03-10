'use client'

import { WalletClient } from '@bsv/sdk'
import type { SecurityLevel, WalletProtocol } from '@bsv/sdk'

let _wallet: WalletClient | null = null

export function getWallet(): WalletClient {
  if (!_wallet) {
    _wallet = new WalletClient('auto')
  }
  return _wallet
}

export async function getIdentityKey(): Promise<string> {
  const wallet = getWallet()
  const protocolID: WalletProtocol = [0 as SecurityLevel, 'claimstamp']
  const result = await wallet.getPublicKey({
    protocolID,
    keyID: '1',
    identityKey: true,
  })
  return result.publicKey
}

export async function isWalletAvailable(): Promise<boolean> {
  try {
    const wallet = getWallet()
    const result = await wallet.isAuthenticated({})
    return result.authenticated
  } catch {
    return false
  }
}
