import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20
    const skip = (page - 1) * limit

    const db = await getDb()
    const collection = db.collection('overlay_typestamps')

    const [stamps, total] = await Promise.all([
      collection.find().sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(),
    ])

    return NextResponse.json({
      stamps,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    console.error('GET /api/overlay/stamps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
