'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useWallet } from './WalletProvider'

function CopyHashButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy hash'}
      className="inline-flex items-center text-th-text-muted hover:text-orange-500 transition-colors shrink-0"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  )
}

function bareHash(hash: string) {
  return hash.startsWith('sha256:') ? hash.slice(7) : hash
}

interface TypeStampSummary {
  txid: string
  hash: string
  title: string
  timestamp: number
  isPublic: boolean
  isSealed: boolean
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
    new Date(ts * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
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
      <div
        className="text-center py-16"
        style={{ animation: 'fade-in-up 600ms ease-out both' }}
      >
        <p className="text-th-text-secondary text-lg">You haven&apos;t stamped anything yet.</p>
        <Link
          href="/"
          className="inline-block mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 font-medium text-sm"
        >
          Stamp something &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with count */}
      <div
        className="flex items-baseline gap-3"
        style={{ animation: 'fade-in-up 600ms ease-out both' }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-th-text">My Stamps</h1>
        <span className="text-sm text-th-text-muted">{typestamps.length} stamp{typestamps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search stamps..."
        className="w-full rounded-xl bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm placeholder:text-th-text-muted focus:outline-none focus:border-orange-500 transition-shadow"
        style={{ transition: 'box-shadow 200ms, border-color 200ms' }}
        onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2)' }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-center text-th-text-muted text-sm py-6">No stamps match &ldquo;{search}&rdquo;</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((ts, i) => (
            <Link
              key={ts.txid}
              href={`/c/${ts.txid}`}
              className="group block rounded-lg border border-th-border bg-th-surface p-4 shadow-sm border-l-2 border-l-transparent hover:border-l-orange-500 hover:bg-orange-500/5 hover:shadow-md transition-all"
              style={{ animation: `fade-in-up 400ms ease-out ${i * 50}ms both` }}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Stamp title as hero */}
                {ts.isSealed ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                      Sealed
                    </span>
                    <span className="text-xs font-mono text-th-text-muted truncate">
                      {bareHash(ts.hash).slice(0, 8)}&hellip;{bareHash(ts.hash).slice(-8)}
                    </span>
                    <CopyHashButton text={ts.hash} />
                  </div>
                ) : (
                  <p className="text-lg font-bold text-th-text leading-snug group-hover:text-orange-500 transition-colors">
                    {ts.title}
                  </p>
                )}

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
                  ts.isSealed ? (
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Listed</span>
                  ) : (
                    <span className="text-orange-500 font-medium">Public</span>
                  )
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
