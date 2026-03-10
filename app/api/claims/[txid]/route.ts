import { NextRequest, NextResponse } from 'next/server'
import { getClaimsCollection } from '@/models/claim'

export async function GET(
  req: NextRequest,
  { params }: { params: { txid: string } }
) {
  try {
    const collection = await getClaimsCollection()
    const claim = await collection.findOne({ txid: params.txid })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Private claims only return content if requester provides matching hash
    if (!claim.isPublic) {
      const { searchParams } = new URL(req.url)
      const hash = searchParams.get('hash')
      if (hash !== claim.hash) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content: _content, ...safe } = claim
        return NextResponse.json(safe)
      }
    }

    return NextResponse.json(claim)
  } catch (error) {
    console.error('GET /api/claims/[txid] error:', error)
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

    const collection = await getClaimsCollection()
    const claim = await collection.findOne({ txid: params.txid })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (claim.identityKey !== identityKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await collection.updateOne(
      { txid: params.txid },
      { $set: { isPublic } }
    )

    return NextResponse.json({ success: true, txid: params.txid, isPublic })
  } catch (error) {
    console.error('PATCH /api/claims/[txid] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
