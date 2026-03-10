'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from './WalletProvider'
import { sha256 } from '@/lib/hash'
import { createTypeStamp } from '@/lib/attest'

const MAX_CHARS = 100

export default function StampForm() {
  const { isConnected, connect } = useWallet()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [content, setContent] = useState('')
  const [showIdentityKey, setShowIdentityKey] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
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
      const checkRes = await fetch(`/api/typestamps/check?hash=${hash}`)
      const checkData = await checkRes.json()
      if (checkData.exists) {
        setError(`A typestamp on these exact characters already exists (${checkData.txid.slice(0, 8)}...).`)
        setIsSubmitting(false)
        return
      }

      // Create on-chain PushDrop token
      const title = trimmed.slice(0, MAX_CHARS)
      const result = await createTypeStamp(trimmed, hash, title)

      // Save metadata to backend
      await fetch('/api/typestamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: result.txid,
          hash: result.hash,
          title: result.title,
          content: trimmed,
          identityKey: result.identityKey,
          timestamp: result.timestamp,
          displayName: displayName.trim(),
          showIdentityKey,
          isPublic,
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
      <div className="rounded-xl border border-th-border bg-th-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-th-text-secondary mb-4 text-sm">
          Connect a BSV wallet to start creating your typestamps on the blockchain.
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

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-th-border bg-th-surface p-6 shadow-sm">
      <label htmlFor="displayName" className="block text-sm font-medium text-th-text-secondary mb-2">
        Display Name
      </label>
      <input
        id="displayName"
        type="text"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        placeholder="Your name or alias (optional)"
        className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow mb-4"
        disabled={isSubmitting}
      />

      <label htmlFor="content" className="block text-sm font-medium text-th-text-secondary mb-2">
        Your TypeStamp<span className="text-red-500">*</span>
        <span className="relative ml-1 inline-block group">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline text-th-text-muted cursor-help">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-th-text text-th-bg text-xs p-2.5 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10 shadow-lg">
            This can be anything &mdash; an idea, a quote, a phrase, a prediction, a trademark, IP, or any other text you want to tokenize and timestamp on the blockchain.
          </span>
        </span>
      </label>
      <textarea
        id="content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type or paste the content you want to typestamp..."
        maxLength={MAX_CHARS}
        rows={3}
        className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-3 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow resize-y"
        disabled={isSubmitting}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-th-text-muted">
        <span>Max {MAX_CHARS} characters</span>
        <span className={content.length >= MAX_CHARS ? 'text-red-500 font-medium' : ''}>
          {content.length}/{MAX_CHARS}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-th-border bg-th-surface-alt text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            disabled={isSubmitting}
          />
          <span className="text-sm text-th-text-secondary">List this typestamp publicly</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showIdentityKey}
            onChange={e => setShowIdentityKey(e.target.checked)}
            className="h-4 w-4 rounded border-th-border bg-th-surface-alt text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            disabled={isSubmitting}
          />
          <span className="text-sm text-th-text-secondary">Show my identity key publicly</span>
        </label>

        <p className="text-xs text-th-text-muted">Both of these settings can be changed later under My TypeStamps.</p>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-gray-400 disabled:to-gray-400 disabled:dark:from-gray-700 disabled:dark:to-gray-700 disabled:text-gray-200 disabled:dark:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none"
      >
        {isSubmitting ? 'Stamping...' : 'Create Your TypeStamp on the Blockchain'}
      </button>
    </form>
  )
}
