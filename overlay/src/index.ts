import 'dotenv/config'
import OverlayExpress from '@bsv/overlay-express'
import { WhatsOnChain, FetchHttpClient } from '@bsv/sdk'
import { MongoClient } from 'mongodb'
import { TypeStampTopicManager } from './TypeStampTopicManager.js'
import { TypeStampLookupService } from './TypeStampLookupService.js'
import { TypeStampStorage } from './TypeStampStorage.js'

const PRIVATE_KEY = process.env.OVERLAY_PRIVATE_KEY || process.env.SERVER_PRIVATE_KEY
const HOSTING_URL = process.env.OVERLAY_HOSTING_URL || 'http://localhost:8080'
const PORT = parseInt(process.env.OVERLAY_PORT || '8080', 10)
const MONGODB_URI = process.env.MONGODB_URI

if (!PRIVATE_KEY) {
  throw new Error('OVERLAY_PRIVATE_KEY (or SERVER_PRIVATE_KEY) is required')
}
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required')
}

async function main() {
  // Connect to MongoDB for our custom storage
  const mongoClient = new MongoClient(MONGODB_URI!)
  await mongoClient.connect()
  const db = mongoClient.db('typestamp')
  const storage = new TypeStampStorage(db)
  await storage.ensureIndexes()
  console.log('Connected to MongoDB — overlay_typestamps collection ready')

  const knexConfig = process.env.KNEX_URL
    ? {
        client: 'pg',
        connection: process.env.KNEX_URL,
      }
    : {
        client: 'better-sqlite3',
        connection: { filename: './data/overlay.db' },
        useNullAsDefault: true,
      }

  const server = new OverlayExpress(
    'typestamp-overlay',
    PRIVATE_KEY!,
    HOSTING_URL
  )

  server.configurePort(PORT)
  server.configureKnex(knexConfig)
  await server.configureMongo(MONGODB_URI!)
  server.configureTopicManager('tm_typestamp', new TypeStampTopicManager())
  server.configureLookupService(
    'ls_typestamp',
    new TypeStampLookupService(storage)
  )

  // Disable GASP sync — it blocks the HTTP listener from starting
  server.configureEnableGASPSync(false)

  // Provide an explicit chain tracker so WhatsOnChain can make HTTP requests in Node
  server.configureChainTracker(new WhatsOnChain('main', { httpClient: new FetchHttpClient(fetch) }))

  // Build the engine (SHIP/SLAP enabled by default)
  await server.configureEngine()
  await server.start()
  console.log(`TypeStamp Overlay running on port ${PORT}`)
}

main().catch(err => {
  console.error('Overlay failed to start:', err)
  process.exit(1)
})
