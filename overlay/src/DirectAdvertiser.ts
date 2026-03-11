import {
  PrivateKey, PublicKey, Transaction, P2PKH, LockingScript,
  Utils, MerklePath
} from '@bsv/sdk'
import { getPaymentPrivateKey } from 'sendover'

// PushDrop script format constants (lockBefore = true, matching old 'pushdrop' library)
const OP_CHECKSIG = 0xac
const OP_DROP = 0x75
const OP_2DROP = 0x6d

const WOC = 'https://api.whatsonchain.com/v1/bsv/main'
const FEE_PER_KB = 50 // 0.05 sat/byte, generous for BSV

interface AdvertisementData {
  protocol: 'SHIP' | 'SLAP'
  topicOrServiceName: string
}

interface Advertisement {
  protocol: 'SHIP' | 'SLAP'
  identityKey: string
  domain: string
  topicOrService: string
  beef?: number[]
  outputIndex?: number
}

interface TaggedBEEF {
  beef: number[]
  topics: string[]
}

interface WocUtxo {
  tx_hash: string
  tx_pos: number
  value: number
  height: number
}

/** Minimally-encoded script push for arbitrary data (same logic as @bsv/sdk PushDrop) */
function pushChunk(data: number[]): { op: number; data?: number[] } {
  if (data.length === 0 || (data.length === 1 && data[0] === 0)) return { op: 0 }
  if (data.length === 1 && data[0] > 0 && data[0] <= 16) return { op: 0x50 + data[0] }
  if (data.length === 1 && data[0] === 0x81) return { op: 0x4f }
  if (data.length <= 75) return { op: data.length, data }
  if (data.length <= 255) return { op: 0x4c, data }
  if (data.length <= 65535) return { op: 0x4d, data }
  return { op: 0x4e, data }
}

/**
 * Build a PushDrop locking script in "lockBefore" format:
 *   <pubkey> OP_CHECKSIG <field1> ... <fieldN> <sig> OP_2DROP... OP_DROP
 * This matches the old `pushdrop` npm package used by SHIPTopicManager / SLAPTopicManager.
 */
function buildPushDropScript(
  lockingPubKey: PublicKey,
  fields: number[][],
  signature: number[]
): LockingScript {
  const pubKeyHex = lockingPubKey.toString()
  const pubKeyBytes = Utils.toArray(pubKeyHex, 'hex') // 33 bytes compressed

  const chunks: Array<{ op: number; data?: number[] }> = []

  // Lock part: <pubkey> OP_CHECKSIG
  chunks.push({ op: pubKeyBytes.length, data: pubKeyBytes })
  chunks.push({ op: OP_CHECKSIG })

  // Data fields
  for (const field of fields) {
    chunks.push(pushChunk(field))
  }

  // Signature
  chunks.push(pushChunk(signature))

  // Drop operations: N fields + 1 signature = N+1 items
  let toDrop = fields.length + 1
  while (toDrop > 1) { chunks.push({ op: OP_2DROP }); toDrop -= 2 }
  if (toDrop === 1) chunks.push({ op: OP_DROP })

  return new LockingScript(chunks)
}

/** Fetch JSON from WhatsOnChain */
async function wocFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${WOC}${path}`)
  if (!res.ok) throw new Error(`WoC ${path}: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

/** Fetch raw transaction hex from WoC */
async function wocRawTx(txid: string): Promise<string> {
  const res = await fetch(`${WOC}/tx/${txid}/hex`)
  if (!res.ok) throw new Error(`WoC raw tx ${txid}: ${res.status}`)
  return res.text()
}

/** Convert WoC TSC proof to @bsv/sdk MerklePath */
async function fetchMerklePath(txid: string): Promise<MerklePath> {
  // Get block height from tx details
  const txInfo = await wocFetch<{ blockheight: number }>(`/tx/${txid}`)
  const blockHeight = txInfo.blockheight
  if (!blockHeight || blockHeight <= 0) {
    throw new Error(`Transaction ${txid} is unconfirmed, cannot build merkle path`)
  }

  // Get TSC merkle proof
  const tscProof = await wocFetch<Array<{
    index: number
    txOrId: string
    target: string
    nodes: (string | '*')[] | null
  }>>(`/tx/${txid}/proof/tsc`)

  if (!tscProof || tscProof.length === 0) {
    throw new Error(`No TSC proof available for ${txid}`)
  }

  const proof = tscProof[0]
  const index = proof.index
  const nodes = proof.nodes

  // Edge case: single transaction in block (coinbase only, or nodes is null)
  if (!nodes || nodes.length === 0) {
    return new MerklePath(blockHeight, [[{ offset: 0, hash: txid, txid: true }]])
  }

  // Build the path array: one level per node in the proof
  const treeHeight = nodes.length
  const path: Array<Array<{ offset: number; hash?: string; txid?: boolean; duplicate?: boolean }>> = []

  for (let level = 0; level < treeHeight; level++) {
    const txOffset = index >> level
    const siblingOffset = txOffset ^ 1
    const levelNodes: Array<{ offset: number; hash?: string; txid?: boolean; duplicate?: boolean }> = []

    // At level 0, include our txid
    if (level === 0) {
      levelNodes.push({ offset: index, hash: txid, txid: true })
    }

    const node = nodes[level]
    if (node === '*') {
      levelNodes.push({ offset: siblingOffset, duplicate: true })
    } else {
      levelNodes.push({ offset: siblingOffset, hash: node })
    }

    // Sort by offset
    levelNodes.sort((a, b) => a.offset - b.offset)
    path.push(levelNodes)
  }

  return new MerklePath(blockHeight, path)
}

/**
 * DirectAdvertiser — creates SHIP/SLAP advertisements by spending P2PKH UTXOs directly,
 * bypassing the Dojo wallet backend that can't see these funds.
 */
export class DirectAdvertiser {
  private privateKey: string
  private hostingDomain: string
  private peerUrls: string[]
  private engine: any

  constructor(privateKey: string, hostingDomain: string, peerUrls: string[] = []) {
    this.privateKey = privateKey
    this.hostingDomain = hostingDomain
    this.peerUrls = peerUrls
  }

  setEngine(engine: any): void {
    this.engine = engine
  }

  /** Alias used by OverlayExpress.start() */
  setLookupEngine(engine: any): void {
    this.engine = engine
  }

  async createAdvertisements(adsData: AdvertisementData[]): Promise<TaggedBEEF> {
    if (adsData.length === 0) throw new Error('No advertisements to create')

    const pk = new PrivateKey(this.privateKey, 'hex')
    const identityPub = PublicKey.fromPrivateKey(pk)
    const identityKey = identityPub.toString() // compressed hex, 66 chars
    const address = identityPub.toAddress()

    console.log(`[DirectAdvertiser] Creating ${adsData.length} ad(s) for ${address}`)

    // Build PushDrop outputs for each advertisement
    const adOutputs: { lockingScript: LockingScript; satoshis: number }[] = []

    for (const ad of adsData) {
      // BRC-42 key derivation
      const derivedKeyHex = getPaymentPrivateKey({
        recipientPrivateKey: this.privateKey,
        senderPublicKey: identityKey,
        invoiceNumber: `2-${ad.protocol}-1`,
        returnType: 'hex'
      }) as string

      const derivedPk = new PrivateKey(derivedKeyHex, 'hex')
      const derivedPub = PublicKey.fromPrivateKey(derivedPk)

      // 4 fields as byte arrays
      const fields: number[][] = [
        Array.from(Buffer.from(ad.protocol)),
        Array.from(Buffer.from(identityKey, 'hex')),
        Array.from(Buffer.from(this.hostingDomain)),
        Array.from(Buffer.from(ad.topicOrServiceName))
      ]

      // Sign concatenated fields (PrivateKey.sign does SHA-256 internally)
      const dataToSign = fields.reduce<number[]>((acc, f) => [...acc, ...f], [])
      const sig = derivedPk.sign(dataToSign)
      const sigDER = sig.toDER() as number[]

      const lockingScript = buildPushDropScript(derivedPub, fields, sigDER)
      adOutputs.push({ lockingScript, satoshis: 1 })

      console.log(`[DirectAdvertiser]   ${ad.protocol} → ${ad.topicOrServiceName}`)
    }

    // Fetch P2PKH UTXOs from WhatsOnChain
    const utxos = await wocFetch<WocUtxo[]>(`/address/${address}/unspent`)
    if (!utxos || utxos.length === 0) {
      throw new Error(`No UTXOs found for ${address}`)
    }

    // Filter to confirmed UTXOs only (height > 0) to ensure merkle proofs are available
    const confirmed = utxos.filter(u => u.height > 0)
    if (confirmed.length === 0) {
      console.warn(`[DirectAdvertiser] All ${utxos.length} UTXOs are unconfirmed — skipping ad creation (will retry next restart)`)
      return { beef: [], topics: [] }
    }

    // Sort by value descending, pick the largest confirmed UTXO
    confirmed.sort((a, b) => b.value - a.value)
    const utxo = confirmed[0]

    console.log(`[DirectAdvertiser] Using UTXO ${utxo.tx_hash}:${utxo.tx_pos} (${utxo.value} sats)`)

    // Fetch source transaction hex and parse it
    const sourceHex = await wocRawTx(utxo.tx_hash)
    const sourceTx = Transaction.fromHex(sourceHex)

    // Fetch merkle path for the source transaction
    const merklePath = await fetchMerklePath(utxo.tx_hash)
    sourceTx.merklePath = merklePath

    // Build the new transaction
    const tx = new Transaction()
    const p2pkh = new P2PKH()

    // Add UTXO input
    tx.addInput({
      sourceTransaction: sourceTx,
      sourceOutputIndex: utxo.tx_pos,
      unlockingScriptTemplate: p2pkh.unlock(pk)
    })

    // Add PushDrop outputs
    for (const out of adOutputs) {
      tx.addOutput({ lockingScript: out.lockingScript, satoshis: out.satoshis })
    }

    // Calculate fee and add change output
    const totalOutputSats = adOutputs.length // 1 sat each
    const estimatedSize = 150 + (adOutputs.length * 250) + 34 + 10 // rough estimate
    const fee = Math.max(1, Math.ceil(estimatedSize * FEE_PER_KB / 1000))
    const changeSats = utxo.value - totalOutputSats - fee

    if (changeSats < 0) {
      throw new Error(`Insufficient funds: have ${utxo.value}, need ${totalOutputSats + fee}`)
    }

    if (changeSats > 0) {
      tx.addOutput({
        lockingScript: p2pkh.lock(address),
        satoshis: changeSats
      })
    }

    // Sign the transaction
    await tx.sign()

    console.log(`[DirectAdvertiser] Signed TX ${tx.id('hex')}, ${tx.toHex().length / 2} bytes, fee ${fee} sats`)

    // Broadcast via WhatsOnChain
    try {
      const broadcastRes = await fetch(`${WOC}/tx/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txhex: tx.toHex() })
      })
      const broadcastText = await broadcastRes.text()
      if (broadcastRes.ok) {
        console.log(`[DirectAdvertiser] Broadcast OK: ${broadcastText}`)
      } else {
        console.warn(`[DirectAdvertiser] Broadcast warning: ${broadcastRes.status} ${broadcastText}`)
      }
    } catch (err) {
      console.warn(`[DirectAdvertiser] Broadcast error (will still submit to engine):`, err)
    }

    // Convert to BEEF for the engine
    const beef = tx.toBEEF()
    const taggedBEEF: TaggedBEEF = {
      beef: Array.from(beef),
      topics: [...new Set(adsData.map(ad => ad.protocol === 'SHIP' ? 'tm_ship' : 'tm_slap'))]
    }

    // Cross-submit to peer overlay nodes so they index our advertisements
    for (const peerUrl of this.peerUrls) {
      try {
        const submitRes = await fetch(`${peerUrl}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taggedBEEF)
        })
        const submitText = await submitRes.text()
        console.log(`[DirectAdvertiser] Submitted to peer ${peerUrl}: ${submitRes.status} ${submitText.substring(0, 120)}`)
      } catch (err) {
        console.warn(`[DirectAdvertiser] Failed to submit to peer ${peerUrl}:`, err)
      }
    }

    return taggedBEEF
  }

  async findAllAdvertisements(protocol: 'SHIP' | 'SLAP'): Promise<Advertisement[]> {
    if (!this.engine) {
      throw new Error('Advertiser must be configured with an engine for advertisement lookup.')
    }

    const advertisements: Advertisement[] = []

    try {
      const lookupAnswer = await this.engine.lookup({
        service: protocol === 'SHIP' ? 'ls_ship' : 'ls_slap',
        query: 'findAll'
      })

      if (lookupAnswer.type === 'output-list') {
        for (const output of lookupAnswer.outputs) {
          try {
            const parsedTx = Transaction.fromBEEF(output.beef)
            const ad = this.parseAdvertisement(parsedTx.outputs[output.outputIndex].lockingScript)
            if (ad && ad.protocol === protocol) {
              advertisements.push({
                ...ad,
                beef: output.beef,
                outputIndex: output.outputIndex
              })
            }
          } catch {
            // Skip unparseable outputs
          }
        }
      }
    } catch (err) {
      console.warn(`[DirectAdvertiser] findAllAdvertisements(${protocol}) error:`, err)
    }

    return advertisements
  }

  async revokeAdvertisements(_advertisements: Advertisement[]): Promise<TaggedBEEF> {
    // No-op: return empty BEEF-like structure (revocation not needed yet)
    return { beef: [], topics: [] }
  }

  parseAdvertisement(outputScript: LockingScript): Advertisement {
    // Decode using the lockBefore=true format:
    // chunks[0] = pubkey, chunks[1] = OP_CHECKSIG, chunks[2..] = fields, then DROP/2DROP
    const chunks = outputScript.chunks

    if (chunks.length < 8) throw new Error('Not a valid PushDrop advertisement')
    if (chunks[1]?.op !== OP_CHECKSIG) throw new Error('Missing OP_CHECKSIG at position 1')

    // Extract data fields (starting at index 2, until we hit DROP/2DROP)
    const fields: number[][] = []
    for (let i = 2; i < chunks.length; i++) {
      const nextOp = chunks[i + 1]?.op
      let data: number[] = chunks[i].data ?? []
      if (data.length === 0) {
        const op = chunks[i].op
        if (op >= 0x50 && op <= 0x5f) data = [op - 0x50]
        else if (op === 0) data = [0]
        else if (op === 0x4f) data = [0x81]
      }
      fields.push(data)
      // If next opcode is DROP or 2DROP, this was the signature (last field before drops)
      if (nextOp === OP_DROP || nextOp === OP_2DROP) break
    }

    // Last field is signature, preceding ones are data
    if (fields.length < 5) throw new Error('Not enough fields for SHIP/SLAP advertisement')

    const protocol = Buffer.from(fields[0]).toString()
    if (protocol !== 'SHIP' && protocol !== 'SLAP') throw new Error(`Invalid protocol: ${protocol}`)

    const identityKey = Buffer.from(fields[1]).toString('hex')
    const domain = Buffer.from(fields[2]).toString()
    const topicOrService = Buffer.from(fields[3]).toString()

    return { protocol, identityKey, domain, topicOrService }
  }
}
