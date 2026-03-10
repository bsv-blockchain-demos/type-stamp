'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWallet } from './WalletProvider'

interface ClaimSummary {
  txid: string
  title: string
  timestamp: number
  isPublic: boolean
  createdAt: string
}

export default function MyClaimsList() {
  const { identityKey, isConnected, connect } = useWallet()
  const [claims, setClaims] = useState<ClaimSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [togglingTxid, setTogglingTxid] = useState<string | null>(null)

  useEffect(() => {
    if (identityKey) loadClaims()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityKey])

  const loadClaims = async () => {
    if (!identityKey) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/claims?identityKey=${identityKey}`)
      const data = await res.json()
      setClaims(data.claims || [])
    } catch (err) {
      console.error('Failed to load claims:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVisibility = async (txid: string, currentPublic: boolean) => {
    if (!identityKey) return
    setTogglingTxid(txid)
    try {
      const res = await fetch(`/api/claims/${txid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityKey, isPublic: !currentPublic }),
      })
      if (res.ok) {
        setClaims(prev =>
          prev.map(c => c.txid === txid ? { ...c, isPublic: !currentPublic } : c)
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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Connect your wallet to view your claims.
        </p>
        <button
          onClick={connect}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">Loading your claims...</div>
  }

  if (claims.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>You haven&apos;t made any claims yet.</p>
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
          Create your first ClaimStamp &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {claims.map(claim => (
        <div
          key={claim.txid}
          className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex items-center justify-between gap-4"
        >
          <Link href={`/c/${claim.txid}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-100 truncate">{claim.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{formatDate(claim.timestamp)}</p>
          </Link>

          <button
            onClick={() => toggleVisibility(claim.txid, claim.isPublic)}
            disabled={togglingTxid === claim.txid}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              claim.isPublic
                ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {togglingTxid === claim.txid ? '...' : claim.isPublic ? 'Public' : 'Private'}
          </button>
        </div>
      ))}
    </div>
  )
}
