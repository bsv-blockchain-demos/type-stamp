import { Collection } from 'mongodb'
import { getDb } from '@/lib/mongodb'

export interface Claim {
  txid: string
  hash: string
  title: string
  content: string
  identityKey: string
  timestamp: number
  isPublic: boolean
  createdAt: Date
}

let _collection: Collection<Claim> | null = null
let _indexesCreated = false

export async function getClaimsCollection(): Promise<Collection<Claim>> {
  if (_collection && _indexesCreated) return _collection

  const db = await getDb()
  _collection = db.collection<Claim>('claims')

  if (!_indexesCreated) {
    await Promise.all([
      _collection.createIndex({ txid: 1 }, { unique: true }),
      _collection.createIndex({ hash: 1 }),
      _collection.createIndex({ identityKey: 1 }),
      _collection.createIndex({ createdAt: -1 }),
    ])
    _indexesCreated = true
  }

  return _collection
}
