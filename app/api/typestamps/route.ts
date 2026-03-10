import { NextRequest, NextResponse } from 'next/server'
import { getTypeStampsCollection, TypeStamp } from '@/models/typestamp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { txid, hash, title, content, identityKey, timestamp, displayName, showIdentityKey, isPublic, isSealed } = body

    const sealed = isSealed === true
    if (!txid || !hash || !identityKey || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!sealed && (!title || !content)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const collection = await getTypeStampsCollection()

    const existing = await collection.findOne({ txid })
    if (existing) {
      return NextResponse.json({ error: 'TypeStamp with this txid already exists' }, { status: 409 })
    }

    const typestamp: TypeStamp = {
      txid,
      hash,
      title: sealed ? 'Sealed Stamp' : title.slice(0, 100),
      content: sealed ? '' : content,
      identityKey,
      timestamp,
      isPublic: isPublic !== false,
      displayName: typeof displayName === 'string' ? displayName.trim() : '',
      showIdentityKey: showIdentityKey === true,
      isSealed: sealed,
      createdAt: new Date(),
    }

    await collection.insertOne(typestamp)
    return NextResponse.json({ success: true, txid }, { status: 201 })
  } catch (error) {
    console.error('POST /api/typestamps error:', error)
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

    const collection = await getTypeStampsCollection()

    const filter = identityKey ? { identityKey } : { isPublic: true }

    const typestamps = await collection
      .find(filter, { projection: { content: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await collection.countDocuments(filter)

    return NextResponse.json({
      typestamps,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    console.error('GET /api/typestamps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
