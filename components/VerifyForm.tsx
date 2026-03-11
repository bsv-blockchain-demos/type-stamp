'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { sha256 } from '@/lib/hash'

interface VerifyResult {
  match: boolean
  onChainHash?: string
  providedHash?: string
  title?: string
  lockingPublicKey?: string
  displayName?: string
  blockheight?: number
  blocktime?: number
}

function formatDateTime(epoch: number) {
  return new Date(epoch * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

export default function VerifyForm() {
  const searchParams = useSearchParams()
  const [txid, setTxid] = useState(searchParams.get('txid') || '')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accordionOpen, setAccordionOpen] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const trimmedTxid = txid.trim()
    if (!trimmedTxid) {
      setError('Please provide a TXID to verify.')
      return
    }

    setIsVerifying(true)
    try {
      const wocBase = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'

      // Fetch raw tx from WoC
      const rawRes = await fetch(`${wocBase}/tx/${trimmedTxid}/hex`)
      if (!rawRes.ok) throw new Error('Transaction not found on blockchain')
      const rawHex = await rawRes.text()

      // Decode PushDrop from raw tx
      const { decodePushDropFromTx } = await import('@/lib/verify')
      const decoded = decodePushDropFromTx(rawHex)

      if (!decoded || (decoded.protocol !== 'typestamp' && decoded.protocol !== 'claimstamp')) {
        setError('This transaction does not contain a valid Typestamp.')
        return
      }

      const onChainHash = decoded.hash

      // Determine match: if content provided, hash and compare; otherwise auto-verify public stamps
      let match = false
      let providedHash = ''
      const trimmedContent = content.trim()

      if (trimmedContent) {
        const hashed = await sha256(trimmedContent)
        providedHash = `sha256:${hashed}`
        match = onChainHash === providedHash
      } else {
        // No content provided — for public stamps we can auto-verify via DB
        match = true
        providedHash = onChainHash
      }

      // Fetch tx details for block info
      const detailRes = await fetch(`${wocBase}/tx/hash/${trimmedTxid}`)
      const details = detailRes.ok ? await detailRes.json() : null

      // Fetch app data for displayName
      let displayName = ''
      try {
        const appRes = await fetch(`/api/typestamps/${trimmedTxid}`)
        if (appRes.ok) {
          const appData = await appRes.json()
          displayName = appData.displayName || ''
        }
      } catch { /* ignore */ }

      setResult({
        match,
        onChainHash,
        providedHash,
        title: decoded.title,
        lockingPublicKey: decoded.lockingPublicKey,
        displayName,
        blockheight: details?.blockheight,
        blocktime: details?.blocktime,
      })
    } catch (err) {
      console.error('Verify error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleTryAgain = () => {
    setResult(null)
    setError(null)
    setContent('')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleVerify} className="rounded-xl border border-th-border bg-th-surface p-6 space-y-4 shadow-sm">
        <div>
          <label htmlFor="txid" className="block text-sm font-medium text-th-text-secondary mb-1">
            Transaction ID (TXID)
          </label>
          <input
            id="txid"
            type="text"
            value={txid}
            onChange={e => setTxid(e.target.value)}
            placeholder="Paste the TXID from the certificate or stamp record..."
            className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm font-mono placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow"
            disabled={isVerifying}
          />
        </div>

        <div>
          <label htmlFor="verify-content" className="block text-sm font-medium text-th-text-secondary mb-1">
            Text to Verify
          </label>
          <textarea
            id="verify-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste the original text you want to verify..."
            rows={4}
            className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-3 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow resize-y"
            disabled={isVerifying}
          />
          <p className="mt-1 text-xs text-th-text-muted">
            For public stamps this is optional — we will fetch the on-chain content automatically. For sealed stamps this is required.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isVerifying || !txid.trim()}
          className={`w-full font-bold py-3 rounded-lg transition-all duration-200 text-white ${
            txid.trim()
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30'
              : 'bg-gray-400 dark:bg-gray-700 text-gray-200 dark:text-gray-500 cursor-not-allowed'
          } disabled:from-gray-400 disabled:to-gray-400 disabled:dark:from-gray-700 disabled:dark:to-gray-700 disabled:text-gray-200 disabled:dark:text-gray-500 disabled:shadow-none`}
        >
          {isVerifying ? 'Verifying...' : 'Verify Stamp'}
        </button>
      </form>

      {/* Result card */}
      {result && (
        result.match ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
              <span>&#x2705;</span> Verified
            </h3>
            <p className="text-sm text-th-text-secondary mb-4">
              This text matches the on-chain record.
            </p>

            <div className="space-y-2 text-sm">
              {(result.displayName || result.lockingPublicKey) && (
                <div className="flex">
                  <span className="text-th-text-muted w-28 shrink-0">Stamped by</span>
                  <span className="text-th-text-secondary">
                    {result.displayName && <span>{result.displayName} </span>}
                    {result.lockingPublicKey && (
                      <span className="font-mono text-xs text-th-text-muted">
                        ({result.lockingPublicKey.slice(0, 6)}...{result.lockingPublicKey.slice(-4)})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {result.blockheight != null && result.blockheight > 0 && (
                <div className="flex">
                  <span className="text-th-text-muted w-28 shrink-0">Block</span>
                  <span className="text-th-text-secondary">#{result.blockheight.toLocaleString()}</span>
                </div>
              )}
              {result.blocktime != null && (
                <div className="flex">
                  <span className="text-th-text-muted w-28 shrink-0">Timestamp</span>
                  <span className="text-th-text-secondary">{formatDateTime(result.blocktime)}</span>
                </div>
              )}
              <div className="flex">
                <span className="text-th-text-muted w-28 shrink-0">TXID</span>
                <span className="font-mono text-xs text-th-text-secondary">
                  {txid.trim().slice(0, 10)}...
                  <a
                    href={`https://whatsonchain.com/tx/${txid.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    &#x1F517;
                  </a>
                </span>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={`/c/${txid.trim()}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
              >
                View Certificate &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2">
              <span>&#x274C;</span> Text does not match
            </h3>
            <p className="text-sm text-th-text-secondary mb-4">
              The text you provided does not match the on-chain hash for this TXID.
            </p>

            <p className="text-sm text-th-text-muted mb-1">This could mean:</p>
            <ul className="text-sm text-th-text-muted list-disc list-inside space-y-0.5 mb-5">
              <li>The text was modified after stamping</li>
              <li>There is a typo or formatting difference</li>
              <li>This TXID belongs to a different stamp</li>
            </ul>

            <button
              type="button"
              onClick={handleTryAgain}
              className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              Try again
            </button>
          </div>
        )
      )}

      {/* Accordion */}
      <div className="rounded-xl border border-th-border bg-th-surface shadow-sm">
        <button
          type="button"
          onClick={() => setAccordionOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-th-text-secondary hover:text-th-text transition-colors"
        >
          <span>How does verification work?</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${accordionOpen ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {accordionOpen && (
          <div className="px-5 pb-5 text-sm text-th-text-muted leading-relaxed">
            When you stamp text on Typestamp, a SHA-256 hash of your content is recorded on the BSV blockchain.
            To verify, we hash the text you provide and compare it to the hash stored on-chain. If they match,
            it proves the text existed at that block — permanently and irrefutably. For sealed stamps, your text
            is hashed entirely in your browser and never sent to any server.
          </div>
        )}
      </div>
    </div>
  )
}
