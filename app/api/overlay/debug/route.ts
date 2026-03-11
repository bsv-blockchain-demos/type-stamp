import { NextResponse } from 'next/server'

export async function GET() {
  const bootstrapUrl = process.env.OVERLAY_URL || 'http://localhost:8080'
  const results: Record<string, unknown> = {
    OVERLAY_URL_raw: process.env.OVERLAY_URL,
    bootstrapUrl,
  }

  // Test health check
  try {
    const res = await fetch(`${bootstrapUrl}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'ls_typestamp', query: {} }),
      signal: AbortSignal.timeout(5000),
    })
    results.healthStatus = res.status
    results.healthOk = true
    results.healthBody = await res.text().catch(() => 'unreadable')
  } catch (e: unknown) {
    results.healthOk = false
    results.healthError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
