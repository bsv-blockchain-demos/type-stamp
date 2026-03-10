'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWallet } from './WalletProvider'

interface TypeStampSummary {
  txid: string
  title: string
  timestamp: number
  isPublic: boolean
  createdAt: string
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-th-bg ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-emerald-500' : 'bg-th-text-muted'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function MyTypeStampsList() {
  const { identityKey, isConnected, connect } = useWallet()
  const [typestamps, setTypeStamps] = useState<TypeStampSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [togglingTxid, setTogglingTxid] = useState<string | null>(null)

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

  const toggleVisibility = async (txid: string, currentPublic: boolean) => {
    if (!identityKey) return
    setTogglingTxid(txid)
    try {
      const res = await fetch(`/api/typestamps/${txid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityKey, isPublic: !currentPublic }),
      })
      if (res.ok) {
        setTypeStamps(prev =>
          prev.map(ts => ts.txid === txid ? { ...ts, isPublic: !currentPublic } : ts)
        )
      }
    } catch (err) {
      console.error('Toggle failed:', err)
    } finally {
      setTogglingTxid(null)
    }
  }

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
          Connect your wallet to view your typestamps.
        </p>
        <button
          onClick={connect}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center text-th-text-muted py-8">Loading your typestamps...</div>
  }

  if (typestamps.length === 0) {
    return (
      <div className="text-center text-th-text-muted py-8">
        <p>You haven&apos;t made any typestamps yet.</p>
        <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-sm mt-2 inline-block transition-colors">
          Create your first TypeStamp &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {typestamps.map(ts => (
        <div
          key={ts.txid}
          className="rounded-lg border border-th-border bg-th-surface p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-th-text truncate">{ts.title}</h3>
              <p className="text-xs text-th-text-muted mt-1">{formatDate(ts.timestamp)}</p>
            </div>

            <Link
              href={`/c/${ts.txid}`}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-th-surface-alt border border-th-border text-th-text-secondary hover:text-th-text hover:border-th-border-hover transition-colors"
            >
              View
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-3 pt-3 border-t border-th-border">
            <ToggleSwitch
              checked={ts.isPublic}
              disabled={togglingTxid === ts.txid}
              onChange={() => toggleVisibility(ts.txid, ts.isPublic)}
            />
            <span className="text-xs text-th-text-muted">
              {togglingTxid === ts.txid
                ? 'Updating...'
                : ts.isPublic
                  ? 'Public — visible in the public feed'
                  : 'Private — only you can see this'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
