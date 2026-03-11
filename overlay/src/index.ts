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

  const engine = (server as any).engine

  // Remove default advertiser + broadcaster before start() to prevent OOM
  // LegacyNinjaAdvertiser pulls massive data from Dojo backend; broadcaster syncs with global network
  engine.advertiser = undefined
  engine.broadcaster = undefined

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

  // start() skips GASP sync + ads since enableGASPSync=false and no advertiser set
  await server.start()
  console.log(`TypeStamp Overlay running on port ${PORT}`)

  // Replace broadcaster with no-op after start() — start() re-creates TopicBroadcaster which
  // causes OOM by broadcasting to every SHIP-discovered peer on the global network.
  // Using a no-op object instead of undefined because Engine.submit() checks `if (this.broadcaster !== undefined)`
  engine.broadcaster = { broadcast: async () => ({ status: 'success', txid: '', message: 'no-op' }) } as any

  // Now inject advertiser and run ads + GASP sync in the background
  const peerUrls = (process.env.OVERLAY_PEER_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (peerUrls.length > 0) console.log(`Peer overlay nodes: ${peerUrls.join(', ')}`)
  const advertiser = new DirectAdvertiser(PRIVATE_KEY!, HOSTING_URL, peerUrls)
  engine.advertiser = advertiser
  advertiser.setEngine(engine)

  setImmediate(async () => {
    // Create SHIP/SLAP advertisements directly (skip syncAdvertisements which OOMs on ls_ship/ls_slap lookup)
    try {
      const topics = Object.keys(engine.managers)
      const services = Object.keys(engine.lookupServices)
      const adsData = [
        ...topics.map((t: string) => ({ protocol: 'SHIP' as const, topicOrServiceName: t })),
        ...services.map((s: string) => ({ protocol: 'SLAP' as const, topicOrServiceName: s })),
      ]
      console.log(`Creating ${adsData.length} SHIP/SLAP advertisements...`)
      const taggedBEEF = await advertiser.createAdvertisements(adsData)
      if (taggedBEEF.beef.length > 0) {
        await engine.submit(taggedBEEF)
        console.log('Advertisements created and submitted!')
      }
    } catch (err) {
      console.warn('Advertisement creation error (non-fatal):', err)
    }

    // Run GASP sync for tm_typestamp only
    try {
      engine.syncConfiguration = { 'tm_typestamp': 'SHIP' }
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
