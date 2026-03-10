import { Collection, Db } from 'mongodb'

export interface OverlayTypeStamp {
  txid: string
  outputIndex: number
  hash: string
  title: string
  timestamp: number
  identityKey: string
  protocol: string
  isSealed: boolean
  indexedAt: Date
}

export class TypeStampStorage {
  private collection: Collection<OverlayTypeStamp>

  constructor(db: Db) {
    this.collection = db.collection<OverlayTypeStamp>('overlay_typestamps')
  }

  async ensureIndexes(): Promise<void> {
    await Promise.all([
      this.collection.createIndex({ txid: 1, outputIndex: 1 }, { unique: true }),
      this.collection.createIndex({ hash: 1 }),
      this.collection.createIndex({ identityKey: 1 }),
      this.collection.createIndex({ timestamp: -1 }),
    ])
  }

  async insertStamp(doc: OverlayTypeStamp): Promise<void> {
    await this.collection.updateOne(
      { txid: doc.txid, outputIndex: doc.outputIndex },
      { $set: doc },
      { upsert: true }
    )
  }

  async findByHash(hash: string): Promise<OverlayTypeStamp[]> {
    return this.collection.find({ hash }).toArray()
  }

  async findByIdentityKey(identityKey: string): Promise<OverlayTypeStamp[]> {
    return this.collection.find({ identityKey }).sort({ timestamp: -1 }).toArray()
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ stamps: OverlayTypeStamp[]; total: number }> {
    const skip = (page - 1) * limit
    const [stamps, total] = await Promise.all([
      this.collection.find().sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(),
    ])
    return { stamps, total }
  }

  async deleteByTxid(txid: string, outputIndex: number): Promise<void> {
    await this.collection.deleteOne({ txid, outputIndex })
  }
}
