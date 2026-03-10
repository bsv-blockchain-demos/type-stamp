import { NextRequest, NextResponse } from 'next/server'
import { getTypeStampsCollection } from '@/models/typestamp'

export async function GET(
  req: NextRequest,
  { params }: { params: { txid: string } }
) {
  try {
    const collection = await getTypeStampsCollection()
    const typestamp = await collection.findOne({ txid: params.txid })

    if (!typestamp) {
      return NextResponse.json({ error: 'TypeStamp not found' }, { status: 404 })
    }

    // Private typestamps only return content if requester provides matching hash
    if (!typestamp.isPublic) {
      const { searchParams } = new URL(req.url)
      const hash = searchParams.get('hash')
      if (hash !== typestamp.hash) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content: _content, ...safe } = typestamp
        return NextResponse.json(safe)
      }
    }

    return NextResponse.json(typestamp)
  } catch (error) {
    console.error('GET /api/typestamps/[txid] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { txid: string } }
) {
  try {
    const body = await req.json()
    const { identityKey, isPublic } = body

    if (!identityKey || typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'Missing identityKey or isPublic' }, { status: 400 })
    }

    const collection = await getTypeStampsCollection()
    const typestamp = await collection.findOne({ txid: params.txid })

    if (!typestamp) {
      return NextResponse.json({ error: 'TypeStamp not found' }, { status: 404 })
    }

    if (typestamp.identityKey !== identityKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await collection.updateOne(
      { txid: params.txid },
      { $set: { isPublic } }
    )

    return NextResponse.json({ success: true, txid: params.txid, isPublic })
  } catch (error) {
    console.error('PATCH /api/typestamps/[txid] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
