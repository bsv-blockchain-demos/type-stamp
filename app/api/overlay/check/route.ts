import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getTypeStampsCollection } from '@/models/typestamp'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const hash = searchParams.get('hash')

    if (!hash) {
      return NextResponse.json({ error: 'Missing hash parameter' }, { status: 400 })
    }

    // Check overlay collection first
    const db = await getDb()
    const overlayCollection = db.collection('overlay_typestamps')
    const overlayMatch = await overlayCollection.findOne(
      { hash },
      { projection: { txid: 1 } }
    )

    if (overlayMatch) {
      return NextResponse.json({ exists: true, txid: overlayMatch.txid })
    }

    // Fallback to app collection
    const appCollection = await getTypeStampsCollection()
    const appMatch = await appCollection.findOne(
      { hash },
      { projection: { txid: 1 } }
    )

    if (appMatch) {
      return NextResponse.json({ exists: true, txid: appMatch.txid })
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error('GET /api/overlay/check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
