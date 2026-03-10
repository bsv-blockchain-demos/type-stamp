import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local')
}

interface MongoGlobal {
  _mongoClientPromise?: Promise<MongoClient>
}

const g = globalThis as unknown as MongoGlobal

if (!g._mongoClientPromise) {
  const client = new MongoClient(MONGODB_URI)
  g._mongoClientPromise = client.connect()
}

const clientPromise = g._mongoClientPromise!

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db('claimstamp')
}

export default clientPromise
