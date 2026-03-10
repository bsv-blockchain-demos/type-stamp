import { NextRequest, NextResponse } from 'next/server'
import { getTypeStampsCollection } from '@/models/typestamp'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const hash = searchParams.get('hash')

    if (!hash) {
      return NextResponse.json({ error: 'Missing hash parameter' }, { status: 400 })
    }

    const collection = await getTypeStampsCollection()
    const existing = await collection.findOne(
      { hash },
      { projection: { txid: 1 } }
    )

    if (existing) {
      return NextResponse.json({ exists: true, txid: existing.txid })
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error('GET /api/typestamps/check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
