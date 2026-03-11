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
  const [showIdentityKey, setShowIdentityKey] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [isSealed, setIsSealed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateTxid, setDuplicateTxid] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDuplicateTxid(null)

    const trimmed = content.trim()
    if (!trimmed) {
      setError('Please enter some content to stamp.')
      return
    }
    if (!displayName.trim()) {
      setError('Please enter a display name.')
      return
    }

    setIsSubmitting(true)
    try {
      const hash = await sha256(trimmed)

      // Check for duplicate
      const checkRes = await fetch(`/api/overlay/check?hash=${hash}`)
      const checkData = await checkRes.json()
      if (checkData.exists) {
        setError('A typestamp on these exact characters already exists.')
        setDuplicateTxid(checkData.txid)
        setIsSubmitting(false)
        return
      }

      // Create on-chain PushDrop token
      const title = isSealed ? 'Sealed Stamp' : trimmed.slice(0, MAX_CHARS)
      const result = await createTypeStamp(trimmed, hash, title)

      // Save metadata to backend + submit rawTx to overlay
      await fetch('/api/typestamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: result.txid,
          hash: result.hash,
          title,
          ...(isSealed ? {} : { content: trimmed }),
          identityKey: result.identityKey,
          timestamp: result.timestamp,
          displayName: displayName.trim(),
          showIdentityKey,
          isPublic,
          isSealed,
          rawTx: result.rawTx,
        }),
      })

      const params = new URLSearchParams({
        new: '1',
        title,
        ...(isSealed ? { isSealed: '1' } : { content: trimmed }),
        identityKey: result.identityKey,
        timestamp: result.timestamp.toString(),
        displayName: displayName.trim(),
      })
      router.push(`/c/${result.txid}?${params.toString()}`)
    } catch (err) {
      console.error('Stamp error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create stamp.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto rounded-xl border border-th-border bg-th-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-th-text-secondary mb-4 text-sm">
          Connect a BSV wallet to start creating your typestamps on the blockchain.
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

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto rounded-xl border border-th-border bg-th-surface p-5 shadow-sm">
      <label htmlFor="content" className="block text-sm font-medium text-th-text-secondary mb-2">
        What do you want to stamp? <span className="text-red-500">*</span>
        <span className="relative ml-1 inline-block group">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline text-th-text-muted cursor-help">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-th-text text-th-bg text-xs p-2.5 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10 shadow-lg">
            Any text. A word, phrase, quote, idea, prediction. Each stamp is permanently recorded on the BSV blockchain. Identical text cannot be stamped twice. First to claim it holds the only timestamp that proves it.
          </span>
        </span>
      </label>
      <input
        id="content"
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="A word, phrase, idea, prediction..."
        maxLength={MAX_CHARS}
        className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow"
        disabled={isSubmitting}
      />
      <div className="mt-1 flex items-center justify-end text-xs text-th-text-muted mb-4">
        {content.length > 0 && (
          <span className={content.length >= MAX_CHARS ? 'text-red-500 font-medium' : ''}>
            {content.length}/{MAX_CHARS}
          </span>
        )}
      </div>

      <label htmlFor="displayName" className="block text-sm font-medium text-th-text-secondary mb-2">
        Author <span className="text-red-500">*</span>
      </label>
      <input
        id="displayName"
        type="text"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        placeholder="Your name or alias"
        className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow"
        disabled={isSubmitting}
      />

      {/* Stamp mode + identity toggle */}
      <div className="mt-5 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-th-text-secondary mb-1">How do you want to stamp this?</legend>

          <label className={`flex items-center gap-3 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="stampMode"
              checked={!isSealed}
              onChange={() => { setIsSealed(false); setIsPublic(true) }}
              disabled={isSubmitting}
              className="accent-orange-500"
            />
            <span className={`text-sm text-th-text ${!isSealed ? 'font-semibold' : ''}`}>Public</span>
            <span className="text-xs text-th-text-muted">Your text is visible to everyone</span>
            <span className="relative inline-block group" onClick={e => e.preventDefault()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-th-text-muted cursor-help">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] rounded-lg bg-th-text text-th-bg text-xs p-2.5 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10 shadow-lg">
                Your text is permanently recorded on the BSV blockchain — visible to everyone. The exact content, your identity key, and a timestamp are stored on-chain. Once stamped, it cannot be modified or deleted by anyone, including Typestamp.
              </span>
            </span>
          </label>

          <label className={`flex items-center gap-3 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="stampMode"
              checked={isSealed}
              onChange={() => { setIsSealed(true); setIsPublic(true) }}
              disabled={isSubmitting}
              className="accent-orange-500"
            />
            <span className={`text-sm text-th-text inline-flex items-center gap-1 ${isSealed ? 'font-semibold' : ''}`}>
              Sealed
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-orange-500">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-xs text-th-text-muted">Only the hash is stored. Content stays private.</span>
            <span className="relative inline-block group" onClick={e => e.preventDefault()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-th-text-muted cursor-help">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] rounded-lg bg-th-text text-th-bg text-xs p-2.5 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10 shadow-lg">
                Only the SHA-256 hash of your text is stored on-chain — your actual content stays completely private. To prove your claim later, share your original text with anyone and they can verify it matches the on-chain hash at the Verify page. The hash is mathematically unique — identical text always produces the same hash, so any attempt to claim the same content will be detected.
              </span>
            </span>
          </label>
        </fieldset>

        <hr className="border-th-border" />

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-th-text-secondary">Show my identity key publicly</span>
            <p className="text-xs text-th-text-muted">Lets others verify you as the author.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showIdentityKey}
            disabled={isSubmitting}
            onClick={() => setShowIdentityKey(v => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-th-bg ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${showIdentityKey ? 'bg-orange-500' : 'bg-th-text-muted'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showIdentityKey ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-500">
          <p>{error}</p>
          {duplicateTxid && (
            <a
              href={`/c/${duplicateTxid}`}
              className="block mt-1 font-mono text-xs text-orange-500 hover:text-orange-400 transition-colors break-all"
            >
              {duplicateTxid} &rarr;
            </a>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:from-gray-400 disabled:to-gray-400 disabled:dark:from-gray-700 disabled:dark:to-gray-700 disabled:text-gray-200 disabled:dark:text-gray-500 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:shadow-none"
      >
        {isSubmitting ? 'Stamping...' : 'Stamp It'}
      </button>
    </form>
  )
}
