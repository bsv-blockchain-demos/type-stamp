import { Collection } from 'mongodb'
import { getDb } from '@/lib/mongodb'

export interface TypeStamp {
  txid: string
  hash: string
  title: string
  content: string
  identityKey: string
  timestamp: number
  isPublic: boolean
  displayName: string
  showIdentityKey: boolean
  createdAt: Date
}

let _collection: Collection<TypeStamp> | null = null
let _indexesCreated = false

export async function getTypeStampsCollection(): Promise<Collection<TypeStamp>> {
  if (_collection && _indexesCreated) return _collection

  const db = await getDb()
  _collection = db.collection<TypeStamp>('typestamps')

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
