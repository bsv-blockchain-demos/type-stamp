'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface OverlayStamp {
  txid: string
  outputIndex: number
  hash: string
  title: string
  timestamp: number
  identityKey: string
  isSealed: boolean
}

export default function NetworkFeed() {
  const [stamps, setStamps] = useState<OverlayStamp[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadStamps(page)
  }, [page])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadStamps(page)
    }, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [page])

  const loadStamps = async (p: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/overlay/stamps?page=${p}`)
      const data = await res.json()
      setStamps(data.stamps)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load overlay stamps:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    })
  }

  if (isLoading && stamps.length === 0) {
    return (
      <div className="text-center text-th-text-muted py-8">
        Loading overlay stamps...
      </div>
    )
  }

  if (!isLoading && stamps.length === 0 && page === 1) {
    return (
      <div className="text-center text-th-text-muted py-8">
        No stamps indexed by the overlay yet. Create one to get started!
      </div>
    )
  }

  const pageSize = 20
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div>
      {/* Header badge */}
      <div className="mb-4 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <span className="text-sm font-medium text-th-text-secondary bg-th-surface-alt px-3 py-1 rounded-full border border-th-border">
          BSV Overlay Network
        </span>
        <span className="text-xs text-th-text-muted">Auto-refreshes every 30s</span>
      </div>

      {/* Immutability banner */}
      <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-2.5 text-sm text-orange-600 dark:text-orange-400">
        All data below is sourced directly from the BSV Overlay Network. Stamps are immutable on-chain records.
      </div>

      <div className="overflow-x-auto rounded-lg border border-th-border shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-th-surface text-th-text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Stamp</th>
              <th className="px-4 py-3 whitespace-nowrap">Identity Key</th>
              <th className="px-4 py-3 whitespace-nowrap">TXID</th>
              <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border">
            {stamps.map(s => (
              <tr key={`${s.txid}-${s.outputIndex}`} className="bg-th-bg hover:bg-th-surface-alt transition-colors">
                <td className="px-4 py-3 max-w-xs truncate">
                  <Link
                    href={`/c/${s.txid}`}
                    className="text-th-text hover:text-orange-500 transition-colors"
                  >
                    {s.isSealed ? (
                      <span className="inline-flex items-center gap-1 text-orange-500 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        Sealed
                      </span>
                    ) : s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-th-text-muted">
                  {s.identityKey && s.identityKey !== 'unknown'
                    ? `${s.identityKey.slice(0, 10)}...`
                    : '\u2014'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/c/${s.txid}`}
                    className="font-mono text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    {s.txid.slice(0, 8)}...
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-th-text-muted">
                  {formatDateTime(s.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-th-text-muted">
          {total > 0
            ? `Showing ${startItem}\u2013${endItem} of ${total} stamp${total !== 1 ? 's' : ''}`
            : 'No stamps'}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1 || isLoading}
            className="px-3 py-1.5 rounded-lg border border-th-border text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            &larr; Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                p === page
                  ? 'border-orange-500 bg-orange-500/10 text-orange-500 font-medium'
                  : 'border-th-border text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages || isLoading}
            className="px-3 py-1.5 rounded-lg border border-th-border text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
