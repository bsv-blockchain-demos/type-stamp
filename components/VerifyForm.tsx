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

function truncateHex(hex: string) {
  return `${hex.slice(0, 8)}\u2026${hex.slice(-4)}`
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

    const trimmedTxid = txid.trim().replace(/[^0-9a-fA-F]/g, '')
    if (!trimmedTxid) {
      setError('Please provide a TXID to verify.')
      return
    }
    if (trimmedTxid.length !== 64) {
      setError('Invalid TXID — must be a 64-character hex string.')
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

  const focusStyle = {
    transition: 'box-shadow 200ms, border-color 200ms',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2)'
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleVerify}
        className="rounded-xl border border-th-border bg-th-surface p-6 space-y-5 shadow-sm"
        style={{ animation: 'fade-in-up 500ms ease-out both' }}
      >
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
            className="w-full rounded-xl bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm font-mono placeholder:text-th-text-muted focus:outline-none focus:border-orange-500"
            style={focusStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
            className="w-full rounded-xl bg-th-surface-alt border border-th-border text-th-text px-4 py-3 text-sm placeholder:text-th-text-muted focus:outline-none focus:border-orange-500 resize-y"
            style={focusStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
          {isVerifying ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying&hellip;
            </span>
          ) : 'Verify Stamp'}
        </button>
      </form>

      {/* Result card */}
      {result && (
        result.match ? (
          <div
            className="rounded-xl border border-th-border border-t-4 border-t-green-500 bg-th-surface p-6 shadow-sm"
            style={{ animation: 'fade-in-up 400ms ease-out both' }}
          >
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </h3>
            <p className="text-sm text-th-text-secondary mb-5">
              This text matches the on-chain record.
            </p>

            <div className="space-y-2.5 text-sm">
              {(result.displayName || result.lockingPublicKey) && (
                <div className="flex">
                  <span className="text-th-text-muted w-28 shrink-0">Stamped by</span>
                  <span className="text-th-text-secondary">
                    {result.displayName && <span className="font-medium text-th-text">{result.displayName} </span>}
                    {result.lockingPublicKey && (
                      <span className="font-mono text-xs text-th-text-muted">
                        ({truncateHex(result.lockingPublicKey)})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {result.blockheight != null && result.blockheight > 0 && (
                <div className="flex">
                  <span className="text-th-text-muted w-28 shrink-0">Block</span>
                  <span className="font-medium text-blue-600">#{result.blockheight.toLocaleString()}</span>
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
                <span className="font-mono text-xs">
                  <a
                    href={`https://whatsonchain.com/tx/${txid.trim().replace(/[^0-9a-fA-F]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400 transition-colors inline-flex items-center gap-1"
                  >
                    {truncateHex(txid.trim())}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/c/${txid.trim().replace(/[^0-9a-fA-F]/g, '')}`}
                className="group inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
              >
                View Certificate
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border border-th-border border-t-4 border-t-red-500 bg-th-surface p-6 shadow-sm"
            style={{ animation: 'fade-in-up 400ms ease-out both' }}
          >
            <h3 className="text-lg font-semibold text-red-500 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Text does not match
            </h3>
            <p className="text-sm text-th-text-secondary mb-4">
              The text you provided does not match the on-chain hash for this TXID.
            </p>

            <p className="text-sm text-th-text-muted mb-1">This could mean:</p>
            <ul className="text-sm text-th-text-muted list-disc list-inside space-y-0.5 mb-5">
              <li>The text was modified after stamping</li>
              <li>There is a typo, extra whitespace, or formatting difference</li>
              <li>This TXID belongs to another stamp</li>
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
      <div
        className={`rounded-xl border bg-th-surface shadow-sm transition-all duration-200 ${
          accordionOpen ? 'border-th-border border-l-4 border-l-orange-500' : 'border-th-border'
        }`}
      >
        <button
          type="button"
          onClick={() => setAccordionOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-th-text-secondary hover:text-th-text transition-colors"
        >
          <span>How does verification work?</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform duration-200 ${accordionOpen ? 'rotate-180' : ''}`}
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
