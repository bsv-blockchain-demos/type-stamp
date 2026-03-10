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

      if (!decoded || decoded.protocol !== 'claimstamp') {
        setError('This transaction does not contain a valid ClaimStamp.')
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
      <form onSubmit={handleVerify} className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div>
          <label htmlFor="txid" className="block text-sm font-medium text-gray-300 mb-1">
            Transaction ID (TXID)
          </label>
          <input
            id="txid"
            type="text"
            value={txid}
            onChange={e => setTxid(e.target.value)}
            placeholder="Enter the TXID of the claim to verify..."
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 px-4 py-2.5 text-sm font-mono placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isVerifying}
          />
        </div>

        <div>
          <label htmlFor="verify-content" className="block text-sm font-medium text-gray-300 mb-1">
            Original Content
          </label>
          <textarea
            id="verify-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste the original content to verify against the on-chain hash..."
            rows={6}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
            disabled={isVerifying}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isVerifying || !txid.trim() || !content.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {result && (
        <div className={`rounded-xl border p-6 ${
          result.match
            ? 'border-emerald-700 bg-emerald-900/20'
            : 'border-red-700 bg-red-900/20'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            result.match ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {result.match ? 'Match Confirmed' : 'Mismatch Detected'}
          </h3>

          <div className="space-y-2 text-sm">
            {result.title && (
              <div>
                <span className="text-gray-500">Title: </span>
                <span className="text-gray-300">{result.title}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">On-chain hash: </span>
              <span className="font-mono text-xs text-gray-300 break-all">{result.onChainHash}</span>
            </div>
            <div>
              <span className="text-gray-500">Your content hash: </span>
              <span className="font-mono text-xs text-gray-300 break-all">{result.providedHash}</span>
            </div>
            {result.lockingPublicKey && (
              <div>
                <span className="text-gray-500">Author: </span>
                <span className="font-mono text-xs text-gray-300 break-all">{result.lockingPublicKey}</span>
              </div>
            )}
            {result.blockheight != null && result.blockheight > 0 && (
              <div>
                <span className="text-gray-500">Block: </span>
                <span className="text-gray-300">{result.blockheight.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
