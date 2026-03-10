import { PushDrop, LockingScript, Utils } from '@bsv/sdk'

const WOC_BASE = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'

export interface TxDetails {
  txid: string
  blockheight: number
  blocktime: number
  confirmations: number
}

export interface DecodedPushDrop {
  protocol: string
  hash: string
  title: string
  timestamp: string
  lockingPublicKey: string
}

export async function fetchTxDetails(txid: string): Promise<TxDetails> {
  const res = await fetch(`${WOC_BASE}/tx/hash/${txid}`)
  if (!res.ok) throw new Error(`Failed to fetch tx ${txid}: ${res.status}`)
  const data = await res.json()
  return {
    txid: data.txid,
    blockheight: data.blockheight ?? -1,
    blocktime: data.blocktime ?? 0,
    confirmations: data.confirmations ?? 0,
  }
}

export async function fetchRawTx(txid: string): Promise<string> {
  const res = await fetch(`${WOC_BASE}/tx/${txid}/hex`)
  if (!res.ok) throw new Error(`Failed to fetch raw tx ${txid}: ${res.status}`)
  return res.text()
}

export function decodePushDropFromTx(rawHex: string): DecodedPushDrop | null {
  try {
    const txBytes = Utils.toArray(rawHex, 'hex')
    // Parse outputs manually — find PushDrop outputs
    // We look through each output's locking script
    const tx = parseRawTxOutputs(txBytes)

    for (const outputScript of tx) {
      try {
        const script = LockingScript.fromHex(outputScript)
        const decoded = PushDrop.decode(script)
        if (decoded && decoded.fields.length >= 4) {
          const protocol = new TextDecoder().decode(new Uint8Array(decoded.fields[0]))
          if (protocol === 'claimstamp') {
            return {
              protocol,
              hash: new TextDecoder().decode(new Uint8Array(decoded.fields[1])),
              title: new TextDecoder().decode(new Uint8Array(decoded.fields[2])),
              timestamp: new TextDecoder().decode(new Uint8Array(decoded.fields[3])),
              lockingPublicKey: decoded.lockingPublicKey.toString(),
            }
          }
        }
      } catch {
        // Not a PushDrop output, continue
      }
    }
    return null
  } catch {
    return null
  }
}

function parseRawTxOutputs(txBytes: number[]): string[] {
  const scripts: string[] = []
  let offset = 4 // skip version

  // Read input count (varint)
  const { value: inputCount, bytesRead: icBytes } = readVarInt(txBytes, offset)
  offset += icBytes

  // Skip inputs
  for (let i = 0; i < inputCount; i++) {
    offset += 32 // prev txid
    offset += 4  // prev vout
    const { value: scriptLen, bytesRead: slBytes } = readVarInt(txBytes, offset)
    offset += slBytes
    offset += scriptLen // scriptSig
    offset += 4  // sequence
  }

  // Read output count (varint)
  const { value: outputCount, bytesRead: ocBytes } = readVarInt(txBytes, offset)
  offset += ocBytes

  // Read outputs
  for (let i = 0; i < outputCount; i++) {
    offset += 8 // satoshis (8 bytes LE)
    const { value: scriptLen, bytesRead: slBytes } = readVarInt(txBytes, offset)
    offset += slBytes
    const scriptBytes = txBytes.slice(offset, offset + scriptLen)
    scripts.push(Utils.toHex(scriptBytes))
    offset += scriptLen
  }

  return scripts
}

function readVarInt(bytes: number[], offset: number): { value: number; bytesRead: number } {
  const first = bytes[offset]
  if (first < 0xfd) return { value: first, bytesRead: 1 }
  if (first === 0xfd) {
    return { value: bytes[offset + 1] | (bytes[offset + 2] << 8), bytesRead: 3 }
  }
  if (first === 0xfe) {
    return {
      value: bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24),
      bytesRead: 5,
    }
  }
  // 0xff — 8 byte, but we'll just handle 4 for practical tx sizes
  return {
    value: bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24),
    bytesRead: 9,
  }
}
