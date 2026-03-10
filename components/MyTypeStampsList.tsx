'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useWallet } from './WalletProvider'

interface TypeStampSummary {
  txid: string
  title: string
  timestamp: number
  isPublic: boolean
  displayName: string
  showIdentityKey: boolean
  identityKey: string
  createdAt: string
}

export default function MyTypeStampsList() {
  const { identityKey, isConnected, connect } = useWallet()
  const [typestamps, setTypeStamps] = useState<TypeStampSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (identityKey) loadTypeStamps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityKey])

  const loadTypeStamps = async () => {
    if (!identityKey) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/typestamps?identityKey=${identityKey}`)
      const data = await res.json()
      setTypeStamps(data.typestamps || [])
    } catch (err) {
      console.error('Failed to load typestamps:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return typestamps
    const q = search.toLowerCase()
    return typestamps.filter(ts =>
      ts.title.toLowerCase().includes(q) ||
      ts.displayName?.toLowerCase().includes(q) ||
      ts.txid.toLowerCase().includes(q)
    )
  }, [typestamps, search])

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-th-border bg-th-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-th-text-secondary mb-4 text-sm">
          Connect your wallet to view your stamps.
        </p>
        <button
          onClick={connect}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center text-th-text-muted py-8">Loading your stamps...</div>
  }

  if (typestamps.length === 0) {
    return (
      <div className="text-center text-th-text-muted py-8">
        <p>You haven&apos;t made any stamps yet.</p>
        <Link href="/" className="text-orange-500 hover:text-orange-400 text-sm mt-2 inline-block transition-colors">
          Create your first stamp &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-th-text">My Stamps</h1>
          <span className="text-sm text-th-text-muted">{typestamps.length} stamp{typestamps.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search stamps..."
        className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-2 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow mb-1"
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-center text-th-text-muted text-sm py-6">No stamps match &ldquo;{search}&rdquo;</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(ts => (
            <Link
              key={ts.txid}
              href={`/c/${ts.txid}`}
              className="group block rounded-lg border border-th-border bg-th-surface p-4 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Stamp title as hero */}
                <p className="text-lg font-bold text-th-text leading-snug group-hover:text-orange-500 transition-colors">
                  &ldquo;{ts.title}&rdquo;
                </p>

                {/* Chevron */}
                <svg className="w-4 h-4 mt-1.5 shrink-0 text-th-text-muted group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>

              {/* Metadata row */}
              <div className="mt-2 flex items-center text-xs text-th-text-muted">
                <span>{formatDate(ts.timestamp)}</span>
                {ts.displayName ? (
                  <>
                    <span className="mx-1.5">&middot;</span>
                    <span className="text-th-text-secondary">{ts.displayName}</span>
                  </>
                ) : null}
                <span className="mx-1.5">&middot;</span>
                {ts.isPublic ? (
                  <span className="text-orange-500 font-medium">Public</span>
                ) : (
                  <span className="text-th-text-muted bg-th-surface-alt px-1.5 py-0.5 rounded">Private</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
