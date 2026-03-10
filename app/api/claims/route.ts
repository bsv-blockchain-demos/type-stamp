import { NextRequest, NextResponse } from 'next/server'
import { getClaimsCollection, Claim } from '@/models/claim'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { txid, hash, title, content, identityKey, timestamp } = body

    if (!txid || !hash || !title || !content || !identityKey || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const collection = await getClaimsCollection()

    const existing = await collection.findOne({ txid })
    if (existing) {
      return NextResponse.json({ error: 'Claim with this txid already exists' }, { status: 409 })
    }

    const claim: Claim = {
      txid,
      hash,
      title: title.slice(0, 100),
      content,
      identityKey,
      timestamp,
      isPublic: true,
      createdAt: new Date(),
    }

    await collection.insertOne(claim)
    return NextResponse.json({ success: true, txid }, { status: 201 })
  } catch (error) {
    console.error('POST /api/claims error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const identityKey = searchParams.get('identityKey')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20
    const skip = (page - 1) * limit

    const collection = await getClaimsCollection()

    const filter = identityKey ? { identityKey } : { isPublic: true }

    const claims = await collection
      .find(filter, { projection: { content: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await collection.countDocuments(filter)

    return NextResponse.json({
      claims,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    console.error('GET /api/claims error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
