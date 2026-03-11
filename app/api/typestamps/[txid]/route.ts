import { NextRequest, NextResponse } from 'next/server'
import { getTypeStampsCollection } from '@/models/typestamp'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ txid: string }> }
) {
  try {
    const { txid } = await props.params
    const collection = await getTypeStampsCollection()
    const typestamp = await collection.findOne({ txid })

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

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ txid: string }> }
) {
  try {
    const { txid } = await props.params
    const { searchParams } = new URL(req.url)
    const identityKey = searchParams.get('identityKey')

    if (!identityKey) {
      return NextResponse.json({ error: 'Missing identityKey' }, { status: 400 })
    }

    const collection = await getTypeStampsCollection()
    const typestamp = await collection.findOne({ txid })

    if (!typestamp) {
      return NextResponse.json({ error: 'TypeStamp not found' }, { status: 404 })
    }

    if (typestamp.identityKey !== identityKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await collection.deleteOne({ txid })

    return NextResponse.json({ success: true, txid })
  } catch (error) {
    console.error('DELETE /api/typestamps/[txid] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ txid: string }> }
) {
  try {
    const { txid } = await props.params
    const body = await req.json()
    const { identityKey, isPublic, hidden } = body

    if (!identityKey) {
      return NextResponse.json({ error: 'Missing identityKey' }, { status: 400 })
    }

    if (typeof isPublic !== 'boolean' && typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'Missing isPublic or hidden' }, { status: 400 })
    }

    const collection = await getTypeStampsCollection()
    const typestamp = await collection.findOne({ txid })

    if (!typestamp) {
      return NextResponse.json({ error: 'TypeStamp not found' }, { status: 404 })
    }

    if (typestamp.identityKey !== identityKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const $set: Record<string, boolean> = {}
    if (typeof isPublic === 'boolean') $set.isPublic = isPublic
    if (typeof hidden === 'boolean') $set.hidden = hidden

    await collection.updateOne({ txid }, { $set })

    return NextResponse.json({ success: true, txid, ...$set })
  } catch (error) {
    console.error('PATCH /api/typestamps/[txid] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
