'use client'

import { PushDrop } from '@bsv/sdk'
import type { SecurityLevel, WalletProtocol } from '@bsv/sdk'
import { getWallet, getIdentityKey } from './wallet'

export interface TypeStampResult {
  txid: string
  hash: string
  title: string
  timestamp: number
  identityKey: string
}

export async function createTypeStamp(
  content: string,
  hash: string,
  title: string
): Promise<TypeStampResult> {
  const wallet = getWallet()
  const identityKey = await getIdentityKey()
  const timestamp = Math.floor(Date.now() / 1000)
  const keyID = Date.now().toString()

  const token = new PushDrop(wallet)
  const protocolID: WalletProtocol = [0 as SecurityLevel, 'typestamp']

  const fields = [
    Array.from(new TextEncoder().encode('typestamp')),
    Array.from(new TextEncoder().encode(`sha256:${hash}`)),
    Array.from(new TextEncoder().encode(title.slice(0, 100))),
    Array.from(new TextEncoder().encode(timestamp.toString())),
  ]

  const lockingScript = await token.lock(
    fields,
    protocolID,
    keyID,
    'self',
    true
  )

  const result = await wallet.createAction({
    description: `TypeStamp: ${title.slice(0, 50)}`,
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: 'TypeStamp PushDrop token',
        basket: 'typestamp',
      },
    ],
    options: {
      acceptDelayedBroadcast: true,
    },
  })

  if (!result.txid) {
    throw new Error('Transaction creation failed — no txid returned')
  }

  return {
    txid: result.txid,
    hash,
    title: title.slice(0, 100),
    timestamp,
    identityKey,
  }
}
