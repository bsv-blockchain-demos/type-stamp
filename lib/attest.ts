'use client'

import { PushDrop, LockingScript, Transaction } from '@bsv/sdk'
import type { SecurityLevel, WalletProtocol } from '@bsv/sdk'
import { getWallet, getIdentityKey } from './wallet'

export interface TypeStampResult {
  txid: string
  hash: string
  title: string
  timestamp: number
  identityKey: string
}

export async function transferTypeStamp(
  txid: string,
  recipient: string
): Promise<{ newTxid: string }> {
  const wallet = getWallet()
  const keyID = Date.now().toString()
  const protocolID: WalletProtocol = [0 as SecurityLevel, 'typestamp']

  // 1. Find the token UTXO in the typestamp basket
  const { outputs } = await wallet.listOutputs({
    basket: 'typestamp',
    include: 'locking scripts',
  })

  const utxo = outputs.find((o) => o.outpoint.startsWith(txid))
  if (!utxo) {
    throw new Error('Token UTXO not found in your wallet. You may not own this token.')
  }
  if (!utxo.lockingScript) {
    throw new Error('Locking script not available for this token.')
  }

  // 2. Decode the existing PushDrop fields
  const decoded = PushDrop.decode(LockingScript.fromHex(utxo.lockingScript))

  // 3. Build unlock template and new locking script
  const pushDrop = new PushDrop(wallet)
  const unlockTemplate = pushDrop.unlock(
    protocolID,
    '1',
    'self',
    'all'
  )

  // 4. Re-lock the token fields for the recipient (exclude signature field — last field from decode)
  const fieldsWithoutSig = decoded.fields.slice(0, -1)
  const lockingScript = await pushDrop.lock(
    fieldsWithoutSig,
    protocolID,
    keyID,
    recipient,
    false
  )

  // 5. Phase 1: createAction with estimated unlocking script length
  const estimatedLength = await unlockTemplate.estimateLength()
  const createResult = await wallet.createAction({
    description: 'Transfer TypeStamp token',
    inputs: [
      {
        outpoint: utxo.outpoint,
        inputDescription: 'Spend TypeStamp PushDrop token',
        unlockingScriptLength: estimatedLength,
      },
    ],
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

  if (!createResult.signableTransaction) {
    throw new Error('Transfer failed — no signable transaction returned')
  }

  // 6. Phase 2: Sign the transaction and finalize
  const { tx: beef, reference } = createResult.signableTransaction
  const tx = Transaction.fromAtomicBEEF(beef)
  const unlockingScript = await unlockTemplate.sign(tx, 0)

  const signResult = await wallet.signAction({
    reference,
    spends: {
      0: { unlockingScript: unlockingScript.toHex() },
    },
    options: {
      acceptDelayedBroadcast: true,
    },
  })

  if (!signResult.txid) {
    throw new Error('Transfer failed — no txid returned after signing')
  }

  return { newTxid: signResult.txid }
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
