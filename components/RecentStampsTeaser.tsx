'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TeaserStamp {
  txid: string
  title: string
  timestamp: number
  isSealed: boolean
}

function relativeTime(epochSec: number): string {
  const diff = Math.floor(Date.now() / 1000) - epochSec
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return new Date(epochSec * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function RecentStampsTeaser() {
  const [stamps, setStamps] = useState<TeaserStamp[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/overlay/stamps?page=1')
      .then(r => r.json())
      .then(data => setStamps((data.stamps || []).slice(0, 3)))
      .catch(() => {})
  }, [])

  if (stamps.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Divider label */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-th-border" />
        <span className="text-xs uppercase tracking-widest text-th-text-muted">Recently Stamped</span>
        <div className="flex-1 h-px bg-th-border" />
      </div>

      <div className="space-y-2">
        {stamps.map((s, i) => (
          <div
            key={s.txid}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-th-surface border-l-2 border-l-transparent hover:border-l-orange-500 hover:bg-orange-500/5 transition-all cursor-pointer"
            style={{ animation: `fade-in-up 500ms ease-out ${i * 100}ms both` }}
            onClick={() => router.push(`/c/${s.txid}`)}
          >
            <span className="text-th-text text-sm truncate">
              {s.isSealed
                ? <span className="italic text-orange-500">🔒 Sealed</span>
                : s.title}
            </span>
            <span className="text-th-text-muted text-xs whitespace-nowrap ml-3">
              · {relativeTime(s.timestamp)}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <Link
          href="/overlaynetwork"
          className="group inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 text-base font-medium transition-colors"
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500"
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          View all stamps on the Overlay Network
          <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  )
}
