import { LookupService, LookupQuestion, LookupAnswer, LookupFormula } from '@bsv/overlay'
import { Script, PushDrop } from '@bsv/sdk'
import { TypeStampStorage } from './TypeStampStorage.js'

export class TypeStampLookupService implements LookupService {
  private storage: TypeStampStorage

  constructor(storage: TypeStampStorage) {
    this.storage = storage
  }

  async outputAdded(
    txid: string,
    outputIndex: number,
    outputScript: Script,
    topic: string
  ): Promise<void> {
    if (topic !== 'tm_typestamp') return
    try {
      const decoded = PushDrop.decode(outputScript)
      if (!decoded?.fields || decoded.fields.length < 4) return

      const protocol = new TextDecoder().decode(new Uint8Array(decoded.fields[0]))
      const hashField = new TextDecoder().decode(new Uint8Array(decoded.fields[1]))
      const title = new TextDecoder().decode(new Uint8Array(decoded.fields[2]))
      const timestamp = parseInt(new TextDecoder().decode(new Uint8Array(decoded.fields[3])), 10)

      const identityKey = decoded.lockingPublicKey?.toString() || 'unknown'

      const hash = hashField.startsWith('sha256:') ? hashField.slice(7) : hashField
      const isSealed = title === 'Sealed Stamp'

      await this.storage.insertStamp({
        txid,
        outputIndex,
        hash,
        title,
        timestamp,
        identityKey,
        protocol,
        isSealed,
        indexedAt: new Date(),
      })

      console.log(`Indexed TypeStamp: ${txid} (${isSealed ? 'sealed' : title})`)
    } catch (err) {
      console.error('TypeStampLookupService.outputAdded error:', err)
    }
  }

  async outputSpent(
    txid: string,
    outputIndex: number,
    topic: string
  ): Promise<void> {
    await this.storage.deleteByTxid(txid, outputIndex)
  }

  async outputDeleted(
    txid: string,
    outputIndex: number,
    topic: string
  ): Promise<void> {
    await this.storage.deleteByTxid(txid, outputIndex)
  }

  async lookup(question: LookupQuestion): Promise<LookupAnswer | LookupFormula> {
    const query = question.query as { type: string; hash?: string; identityKey?: string; page?: number; limit?: number }

    if (query.type === 'findByHash' && query.hash) {
      const stamps = await this.storage.findByHash(query.hash)
      return stamps.map(s => ({
        txid: s.txid,
        outputIndex: s.outputIndex,
      }))
    }

    if (query.type === 'findByIdentityKey' && query.identityKey) {
      const stamps = await this.storage.findByIdentityKey(query.identityKey)
      return stamps.map(s => ({
        txid: s.txid,
        outputIndex: s.outputIndex,
      }))
    }

    if (query.type === 'findAll') {
      const { stamps } = await this.storage.findAll(query.page || 1, query.limit || 20)
      return stamps.map(s => ({
        txid: s.txid,
        outputIndex: s.outputIndex,
      }))
    }

    throw new Error(`Unknown lookup query type: ${query.type}`)
  }

  async getDocumentation(): Promise<string> {
    return `# TypeStamp Lookup Service

Query TypeStamp data indexed from the BSV Overlay Network.

## Query Types

### findByHash
Find stamps by content hash.
\`\`\`json
{ "type": "findByHash", "hash": "<sha256-hex>" }
\`\`\`

### findByIdentityKey
Find stamps by creator identity key.
\`\`\`json
{ "type": "findByIdentityKey", "identityKey": "<pubkey>" }
\`\`\`

### findAll
Paginated listing of all stamps.
\`\`\`json
{ "type": "findAll", "page": 1, "limit": 20 }
\`\`\``
  }

  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'TypeStamp Lookup Service',
      shortDescription: 'Lookup TypeStamp PushDrop tokens indexed from the BSV overlay',
      version: '0.1.0',
    }
  }
}
