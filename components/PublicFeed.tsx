'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ClaimSummary {
  txid: string
  title: string
  identityKey: string
  timestamp: number
  createdAt: string
}

export default function PublicFeed() {
  const [claims, setClaims] = useState<ClaimSummary[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClaims(page)
  }, [page])

  const loadClaims = async (p: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/claims?page=${p}`)
      const data = await res.json()
      setClaims(prev => p === 1 ? data.claims : [...prev, ...data.claims])
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Failed to load claims:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading && claims.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading recent claims...
      </div>
    )
  }

  if (claims.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No public claims yet. Be the first!
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {claims.map(claim => (
          <Link
            key={claim.txid}
            href={`/c/${claim.txid}`}
            className="block rounded-lg border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors"
          >
            <h3 className="font-medium text-gray-100 truncate">{claim.title}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="font-mono">{claim.identityKey.slice(0, 8)}...</span>
              <span>{formatDate(claim.timestamp)}</span>
            </div>
          </Link>
        ))}
      </div>

      {page < totalPages && (
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={isLoading}
          className="mt-4 w-full text-sm text-gray-400 hover:text-white py-2 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
