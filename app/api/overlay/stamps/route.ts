import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { discoverOverlayNodes } from '@/lib/overlay-discovery'

const WOC_BASE = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20
    const skip = (page - 1) * limit

    const db = await getDb()
    const collection = db.collection('overlay_typestamps')

    // Get hidden txids from the app collection to exclude from results
    const appCollection = db.collection('typestamps')
    const hiddenDocs = await appCollection
      .find({ hidden: true }, { projection: { txid: 1 } })
      .toArray()
    const hiddenTxids = new Set(hiddenDocs.map(d => d.txid))

    const overlayFilter = hiddenTxids.size > 0
      ? { txid: { $nin: Array.from(hiddenTxids) } }
      : {}

    const [stamps, total] = await Promise.all([
      collection.find(overlayFilter).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(overlayFilter),
    ])

    // Join with typestamps collection to get displayName by identityKey
    const identityKeys = Array.from(new Set(
      stamps.map(s => s.identityKey).filter((k): k is string => !!k && k !== 'unknown')
    ))
    if (identityKeys.length > 0) {
      const appCollection = db.collection('typestamps')
      const appDocs = await appCollection
        .find({ identityKey: { $in: identityKeys } }, { projection: { identityKey: 1, displayName: 1 } })
        .toArray()
      const nameMap = new Map<string, string>()
      for (const d of appDocs) {
        if (d.displayName && !nameMap.has(d.identityKey)) {
          nameMap.set(d.identityKey, d.displayName)
        }
      }
      for (const s of stamps) {
        s.displayName = nameMap.get(s.identityKey) || ''
      }
    }

    // Fetch block heights from WoC for stamps missing blockHeight
    const needHeight = stamps.filter(s => s.blockHeight == null && s.txid)
    if (needHeight.length > 0) {
      const results = await Promise.allSettled(
        needHeight.map(s =>
          fetch(`${WOC_BASE}/tx/hash/${s.txid}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => ({ txid: s.txid, blockHeight: data?.blockheight ?? null }))
        )
      )
      const updates: { txid: string; blockHeight: number }[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.blockHeight != null) {
          updates.push(r.value as { txid: string; blockHeight: number })
        }
      }
      // Backfill into DB and merge into response
      if (updates.length > 0) {
        const heightMap = new Map(updates.map(u => [u.txid, u.blockHeight]))
        await Promise.allSettled(
          updates.map(u =>
            collection.updateOne({ txid: u.txid }, { $set: { blockHeight: u.blockHeight } })
          )
        )
        for (const s of stamps) {
          if (s.blockHeight == null && heightMap.has(s.txid)) {
            s.blockHeight = heightMap.get(s.txid)
          }
        }
      }
    }

    // Discover overlay nodes via SHIP
    const { activeNodes, nodeUrls } = await discoverOverlayNodes()

    return NextResponse.json({
      stamps,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      activeNodes,
      nodeUrls,
    })
  } catch (error) {
    console.error('GET /api/overlay/stamps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
