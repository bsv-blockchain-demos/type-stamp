'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { sha256 } from '@/lib/hash'

interface VerifyResult {
  match: boolean
  onChainHash?: string
  providedHash?: string
  title?: string
  lockingPublicKey?: string
  blockheight?: number
  blocktime?: number
}

export default function VerifyForm() {
  const searchParams = useSearchParams()
  const [txid, setTxid] = useState(searchParams.get('txid') || '')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!txid.trim() || !content.trim()) {
      setError('Please provide both a TXID and content to verify.')
      return
    }

    setIsVerifying(true)
    try {
      const providedHash = await sha256(content.trim())
      const wocBase = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'

      // Fetch raw tx from WoC
      const rawRes = await fetch(`${wocBase}/tx/${txid.trim()}/hex`)
      if (!rawRes.ok) throw new Error('Transaction not found on blockchain')
      const rawHex = await rawRes.text()

      // Decode PushDrop from raw tx — dynamic import to avoid SSR issues
      const { decodePushDropFromTx } = await import('@/lib/verify')
      const decoded = decodePushDropFromTx(rawHex)

      if (!decoded || (decoded.protocol !== 'typestamp' && decoded.protocol !== 'claimstamp')) {
        setError('This transaction does not contain a valid TypeStamp.')
        return
      }

      const onChainHash = decoded.hash // format: "sha256:<hex>"
      const expectedHash = `sha256:${providedHash}`

      // Also fetch tx details for block info
      const detailRes = await fetch(`${wocBase}/tx/hash/${txid.trim()}`)
      const details = detailRes.ok ? await detailRes.json() : null

      setResult({
        match: onChainHash === expectedHash,
        onChainHash,
        providedHash: expectedHash,
        title: decoded.title,
        lockingPublicKey: decoded.lockingPublicKey,
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
            placeholder="Enter the TXID of the typestamp to verify..."
            className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-2.5 text-sm font-mono placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow"
            disabled={isVerifying}
          />
        </div>

        <div>
          <label htmlFor="verify-content" className="block text-sm font-medium text-th-text-secondary mb-1">
            Original Content
          </label>
          <textarea
            id="verify-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste the original content to verify against the on-chain hash..."
            rows={6}
            className="w-full rounded-lg bg-th-surface-alt border border-th-border text-th-text px-4 py-3 text-sm placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow resize-y"
            disabled={isVerifying}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isVerifying}
          className={`w-full font-bold py-3 rounded-lg transition-all duration-200 text-white ${
            !txid.trim() || !content.trim()
              ? 'bg-gray-400 dark:bg-gray-700 text-gray-200 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30'
          } disabled:from-gray-400 disabled:to-gray-400 disabled:dark:from-gray-700 disabled:dark:to-gray-700 disabled:text-gray-200 disabled:dark:text-gray-500 disabled:shadow-none`}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {result && (
        <div className={`rounded-xl border p-6 shadow-sm ${
          result.match
            ? 'border-orange-500/30 bg-orange-500/5'
            : 'border-red-500/30 bg-red-500/5'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            result.match ? 'text-orange-500' : 'text-red-500'
          }`}>
            {result.match ? 'Match Confirmed' : 'Mismatch Detected'}
          </h3>

          <div className="space-y-2 text-sm">
            {result.title && (
              <div>
                <span className="text-th-text-muted">Title: </span>
                <span className="text-th-text-secondary">{result.title}</span>
              </div>
            )}
            <div>
              <span className="text-th-text-muted">On-chain hash: </span>
              <span className="font-mono text-xs text-th-text-secondary break-all">{result.onChainHash}</span>
            </div>
            <div>
              <span className="text-th-text-muted">Your content hash: </span>
              <span className="font-mono text-xs text-th-text-secondary break-all">{result.providedHash}</span>
            </div>
            {result.lockingPublicKey && (
              <div>
                <span className="text-th-text-muted">Author: </span>
                <span className="font-mono text-xs text-th-text-secondary break-all">{result.lockingPublicKey}</span>
              </div>
            )}
            {result.blockheight != null && result.blockheight > 0 && (
              <div>
                <span className="text-th-text-muted">Block: </span>
                <span className="text-th-text-secondary">{result.blockheight.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
