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
    <div className="space-y-3">
      {stamps.map(s => (
        <div
          key={s.txid}
          className="flex items-center justify-between px-4 py-2 rounded-lg bg-th-surface hover:bg-th-surface-alt transition-colors cursor-pointer"
          onClick={() => router.push(`/c/${s.txid}`)}
        >
          <span className="text-th-text text-sm truncate">
            {s.isSealed ? '🔒 Sealed' : s.title}
          </span>
          <span className="text-th-text-muted text-xs whitespace-nowrap ml-3">
            · {relativeTime(s.timestamp)}
          </span>
        </div>
      ))}
      <div className="text-center pt-1">
        <Link
          href="/overlaynetwork"
          className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors"
        >
          View all stamps on the Overlay Network →
        </Link>
      </div>
    </div>
  )
}
