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

    // Join with typestamps collection to get displayName (try txid first, then identityKey)
    const txids = stamps.map(s => s.txid).filter(Boolean)
    const identityKeys = Array.from(new Set(
      stamps.map(s => s.identityKey).filter((k): k is string => !!k && k !== 'unknown')
    ))
    const appByTxid = new Map<string, { displayName?: string; identityKey?: string; showIdentityKey?: boolean }>()
    const nameByKey = new Map<string, string>()
    if (txids.length > 0 || identityKeys.length > 0) {
      const appDocs = await appCollection
        .find(
          { $or: [{ txid: { $in: txids } }, { identityKey: { $in: identityKeys } }] },
          { projection: { txid: 1, identityKey: 1, displayName: 1, showIdentityKey: 1 } }
        )
        .toArray()
      for (const d of appDocs) {
        if (d.txid) appByTxid.set(d.txid, { displayName: d.displayName, identityKey: d.identityKey, showIdentityKey: d.showIdentityKey })
        if (d.displayName && d.identityKey && !nameByKey.has(d.identityKey)) {
          nameByKey.set(d.identityKey, d.displayName)
        }
      }
      for (const s of stamps) {
        const appDoc = appByTxid.get(s.txid)
        if (appDoc) {
          // Override the derived locking key with the real identity key from the app
          if (appDoc.identityKey) s.identityKey = appDoc.identityKey
          if (appDoc.displayName) s.displayName = appDoc.displayName
          s.showIdentityKey = appDoc.showIdentityKey !== false
        } else {
          s.displayName = nameByKey.get(s.identityKey) || ''
        }
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

    // Fetch per-node stats in parallel
    const nodeStatsResults = await Promise.allSettled(
      nodeUrls.map(url =>
        fetch(`${url}/stats`, { signal: AbortSignal.timeout(3000) })
          .then(r => r.ok ? r.json() : { stamps: 0 })
          .then(data => ({ url, stamps: data.stamps ?? 0 }))
      )
    )
    const nodeStats = nodeUrls.map(url => {
      const result = nodeStatsResults.find(
        r => r.status === 'fulfilled' && r.value.url === url
      )
      return {
        url,
        stamps: result?.status === 'fulfilled' ? result.value.stamps : 0,
      }
    })

    return NextResponse.json({
      stamps,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      activeNodes,
      nodeUrls,
      nodeStats,
    })
  } catch (error) {
    console.error('GET /api/overlay/stamps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
