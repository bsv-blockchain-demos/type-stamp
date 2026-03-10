'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from './WalletProvider'
import { sha256 } from '@/lib/hash'
import { createClaimStamp } from '@/lib/attest'

export default function StampForm() {
  const { isConnected, connect } = useWallet()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = content.trim()
    if (!trimmed) {
      setError('Please enter some content to stamp.')
      return
    }

    setIsSubmitting(true)
    try {
      const hash = await sha256(trimmed)

      // Check for duplicate
      const checkRes = await fetch(`/api/claims/check?hash=${hash}`)
      const checkData = await checkRes.json()
      if (checkData.exists) {
        setError(`A claim on these exact characters already exists (${checkData.txid.slice(0, 8)}...).`)
        setIsSubmitting(false)
        return
      }

      // Create on-chain PushDrop token
      const title = trimmed.slice(0, 100)
      const result = await createClaimStamp(trimmed, hash, title)

      // Save metadata to backend
      await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: result.txid,
          hash: result.hash,
          title: result.title,
          content: trimmed,
          identityKey: result.identityKey,
          timestamp: result.timestamp,
        }),
      })

      router.push(`/c/${result.txid}`)
    } catch (err) {
      console.error('Stamp error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create stamp.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Connect a BSV wallet to start timestamping your claims on the blockchain.
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

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
        Your Claim
      </label>
      <textarea
        id="content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type or paste the content you want to timestamp..."
        rows={6}
        className="w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
        disabled={isSubmitting}
      />

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Stamping...' : 'Claim Stamp'}
      </button>
    </form>
  )
}
