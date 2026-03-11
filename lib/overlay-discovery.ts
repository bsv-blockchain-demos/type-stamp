import { Transaction, PushDrop } from '@bsv/sdk'

interface DiscoveryResult {
  activeNodes: number
  nodeUrls: string[]
}

interface CachedDiscovery {
  result: DiscoveryResult
  timestamp: number
}

interface DiscoveryGlobal {
  _overlayDiscoveryCache?: CachedDiscovery
}

const CACHE_TTL = 30_000 // 30 seconds
const g = globalThis as unknown as DiscoveryGlobal

export async function discoverOverlayNodes(): Promise<DiscoveryResult> {
  // Return cached result if fresh
  const cached = g._overlayDiscoveryCache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const bootstrapUrl = process.env.OVERLAY_URL || 'http://localhost:8080'
  const discoveredUrls = new Set<string>()

  // Seed known node URLs from env (comma-separated)
  const knownUrls = process.env.OVERLAY_URLS
  if (knownUrls) {
    for (const u of knownUrls.split(',')) {
      const trimmed = u.trim()
      if (trimmed) discoveredUrls.add(trimmed.replace(/\/+$/, ''))
    }
  }

  try {
    // Query SHIP for nodes advertising tm_typestamp
    const res = await fetch(`${bootstrapUrl}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'ls_ship',
        query: { topics: ['tm_typestamp'] },
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) {
      const data = await res.json()
      const outputs = Array.isArray(data) ? data : data?.outputs ?? []

      for (const output of outputs) {
        try {
          const beef = typeof output.beef === 'string'
            ? Array.from(Buffer.from(output.beef, 'hex'))
            : output.beef
          const tx = Transaction.fromBEEF(beef)
          const outIdx = output.outputIndex ?? 0
          const lockingScript = tx.outputs[outIdx]?.lockingScript
          if (!lockingScript) continue

          const decoded = PushDrop.decode(lockingScript)
          if (decoded?.fields && decoded.fields.length >= 3) {
            const domain = new TextDecoder().decode(new Uint8Array(decoded.fields[2]))
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
              discoveredUrls.add(domain.replace(/\/+$/, ''))
            }
          }
        } catch {
          // Skip unparseable outputs
        }
      }
    }
  } catch {
    // SHIP lookup failed — fall back to bootstrap URL only
  }

  // Always include bootstrap URL
  discoveredUrls.add(bootstrapUrl)

  // Health-check all URLs in parallel
  const allUrls = Array.from(discoveredUrls)
  const checks = await Promise.allSettled(
    allUrls.map(url =>
      fetch(`${url}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'ls_typestamp', query: {} }),
        signal: AbortSignal.timeout(3000),
      }).then(() => url)
    )
  )

  const activeUrls = checks
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<string | null>).value)
    .filter((url): url is string => url !== null)

  const result: DiscoveryResult = {
    activeNodes: activeUrls.length,
    nodeUrls: activeUrls,
  }

  g._overlayDiscoveryCache = { result, timestamp: Date.now() }
  return result
}
