import 'dotenv/config'
import { mkdirSync } from 'fs'
import OverlayExpress from '@bsv/overlay-express'
import { WhatsOnChain, FetchHttpClient } from '@bsv/sdk'
import { MongoClient } from 'mongodb'
import { TypeStampTopicManager } from './TypeStampTopicManager.js'
import { TypeStampLookupService } from './TypeStampLookupService.js'
import { TypeStampStorage } from './TypeStampStorage.js'
import { DirectAdvertiser } from './DirectAdvertiser.js'

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

  // Ensure data directory exists for SQLite
  mkdirSync('./data', { recursive: true })

  const knexUrl = process.env.KNEX_URL
  const knexConfig = knexUrl
    ? {
        client: knexUrl.startsWith('mysql') ? 'mysql2' : 'pg',
        connection: knexUrl,
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

  // Disable GASP in config so start() doesn't block; we register routes + run sync manually
  server.configureEnableGASPSync(false)

  // Provide an explicit chain tracker so WhatsOnChain can make HTTP requests in Node
  server.configureChainTracker(new WhatsOnChain('main', { httpClient: new FetchHttpClient(fetch) }))

  // Build the engine (SHIP/SLAP enabled by default)
  await server.configureEngine()

  // Inject DirectAdvertiser to bypass Dojo wallet (P2PKH UTXOs are invisible to Dojo)
  const peerUrls = (process.env.OVERLAY_PEER_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (peerUrls.length > 0) console.log(`Peer overlay nodes: ${peerUrls.join(', ')}`)
  const advertiser = new DirectAdvertiser(PRIVATE_KEY!, HOSTING_URL, peerUrls)
  const engine = (server as any).engine
  engine.advertiser = advertiser
  advertiser.setEngine(engine)

  // Manually register GASP sync routes (normally done by start() when enableGASPSync=true)
  const app = (server as any).app
  if (app) {
    app.post('/requestSyncResponse', async (req: any, res: any) => {
      try {
        const topic = req.headers['x-bsv-topic'] as string
        const response = await engine.provideForeignSyncResponse(req.body, topic)
        res.status(200).json(response)
      } catch (error: any) {
        console.error('Error in /requestSyncResponse:', error)
        res.status(400).json({ status: 'error', message: error?.message || 'Unknown error' })
      }
    })

    app.post('/requestForeignGASPNode', async (req: any, res: any) => {
      try {
        const { graphID, txid, outputIndex } = req.body
        const response = await engine.provideForeignGASPNode(graphID, txid, outputIndex)
        res.status(200).json(response)
      } catch (error: any) {
        console.error('Error in /requestForeignGASPNode:', error)
        res.status(400).json({ status: 'error', message: error?.message || 'Unknown error' })
      }
    })

    app.get('/stats', async (_req: any, res: any) => {
      try {
        const stamps = await storage.count()
        res.json({ stamps })
      } catch {
        res.status(500).json({ stamps: 0 })
      }
    })
  }

  // start() skips GASP sync + routes since enableGASPSync=false, but our routes are already registered
  await server.start()
  console.log(`TypeStamp Overlay running on port ${PORT}`)

  // Run GASP sync in the background (non-blocking) after HTTP listener is up
  // Only sync tm_typestamp between our nodes — skip tm_ship/tm_slap to avoid rate limits
  engine.syncConfiguration = { 'tm_typestamp': 'SHIP' }

  setImmediate(async () => {
    try {
      console.log('Starting GASP sync in background...')
      await engine.startGASPSync()
      console.log('GASP sync complete!')
    } catch (err) {
      console.warn('GASP sync error (non-fatal):', err)
    }
  })
}

main().catch(err => {
  console.error('Overlay failed to start:', err)
  process.exit(1)
})
