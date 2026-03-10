'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import ShareButtons from './ShareButtons'
import { useWallet } from './WalletProvider'

interface CertificateCardProps {
  txid: string
  title: string
  content?: string
  identityKey: string
  displayName?: string
  showIdentityKey?: boolean
  isSealed?: boolean
  timestamp: number
  blockheight?: number
  blocktime?: number
  confirmations?: number
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className="inline-flex items-center text-th-text-muted hover:text-orange-500 transition-colors"
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

function truncateHex(hex: string) {
  return `${hex.slice(0, 8)}…${hex.slice(-8)}`
}

export default function CertificateCard({
  txid,
  title,
  content,
  identityKey,
  displayName,
  showIdentityKey = true,
  isSealed = false,
  timestamp,
  blockheight,
  confirmations,
}: CertificateCardProps) {
  const [liveConfirmations, setLiveConfirmations] = useState(confirmations)
  const [liveBlockheight, setLiveBlockheight] = useState(blockheight)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { identityKey: walletIdentityKey } = useWallet()
  const router = useRouter()
  const isOwner = walletIdentityKey === identityKey

  const isPending = !liveConfirmations || liveConfirmations <= 0
  const searchParams = useSearchParams()

  const handleDelete = async () => {
    if (!walletIdentityKey) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/typestamps/${txid}?identityKey=${walletIdentityKey}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/mytypestamps')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete stamp.')
      }
    } catch {
      alert('Failed to delete stamp.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    const duration = 1500
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#f97316', '#f59e0b', '#ffffff'] })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f97316', '#f59e0b', '#ffffff'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [searchParams])

  const refreshConfirmations = useCallback(async () => {
    const wocBase = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'
    try {
      const res = await fetch(`${wocBase}/tx/hash/${txid}`)
      if (res.ok) {
        const data = await res.json()
        if (data.confirmations != null) setLiveConfirmations(data.confirmations)
        if (data.blockheight != null) setLiveBlockheight(data.blockheight)
      }
    } catch { /* ignore */ }
  }, [txid])

  useEffect(() => {
    if (!isPending) return
    const interval = setInterval(refreshConfirmations, 10_000)
    return () => clearInterval(interval)
  }, [isPending, refreshConfirmations])

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

  return (
    <div className="rounded-xl border border-th-border bg-th-surface overflow-hidden shadow-sm">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Celebratory header */}
        <div className="text-center space-y-1">
          <p className="text-orange-500 text-lg font-semibold">Stamped forever.</p>
          <p className="text-th-text-muted text-sm">
            {isPending ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                Confirming on BSV Blockchain&hellip;
              </span>
            ) : (
              <>
                Verified on BSV Blockchain &middot; {liveConfirmations!.toLocaleString()} confirmation{liveConfirmations !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Hero content */}
        {isSealed ? (
          <div className="text-center space-y-2 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto text-th-text-muted">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold text-th-text">This stamp is sealed.</p>
            <p className="text-sm text-th-text-muted">Content is hidden. Only the hash is stored on-chain.</p>
            <div className="mt-3 rounded-lg border border-th-border bg-th-surface-alt p-4 text-left text-sm space-y-1.5">
              <p className="font-medium text-th-text-secondary">To prove your claim to someone:</p>
              <ol className="list-decimal list-inside text-th-text-muted space-y-0.5">
                <li>Share your original text with them</li>
                <li>Send them this TXID</li>
                <li>They verify at <Link href={`/verify?txid=${txid}`} className="text-orange-500 hover:text-orange-400 transition-colors">/verify</Link></li>
              </ol>
            </div>
          </div>
        ) : (
          <blockquote className="text-2xl sm:text-3xl font-bold text-th-text leading-snug text-center">
            &ldquo;{content || title}&rdquo;
          </blockquote>
        )}

        {/* Author */}
        <div className="text-center space-y-1">
          {showIdentityKey && (
            <p className="text-xs text-th-text-muted font-mono inline-flex items-center gap-1.5">
              {truncateHex(identityKey)}
              <CopyButton text={identityKey} />
            </p>
          )}
          {displayName && (
            <p className="text-sm font-medium text-th-text">{displayName}</p>
          )}
        </div>

        {/* Pending notice */}
        {isPending && (
          <p className="text-center text-xs text-th-text-muted">
            Your stamp is being confirmed by the network. This usually takes under a minute.
          </p>
        )}

        {/* Metadata row */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm border-t border-th-border pt-4">
          <div>
            <span className="text-th-text-muted text-xs block">Timestamp</span>
            <p className="text-th-text-secondary font-medium">{formatDate(timestamp)}</p>
          </div>
          <div>
            <span className="text-th-text-muted text-xs block">Block</span>
            <p className="text-th-text-secondary font-medium">
              {liveBlockheight != null && liveBlockheight > 0 ? (
                <>#{liveBlockheight.toLocaleString()}</>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
                  </span>
                  Pending
                </span>
              )}
            </p>
          </div>
          <div>
            <span className="text-th-text-muted text-xs block">Confirmations</span>
            <p className="text-th-text-secondary font-medium">
              {liveConfirmations != null && liveConfirmations > 0 ? liveConfirmations.toLocaleString() : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
                  </span>
                  0
                </span>
              )}
            </p>
          </div>
        </div>

        {/* TXID */}
        <div className="text-center">
          <span className="text-th-text-muted text-xs">TXID</span>
          <p className="font-mono text-xs text-th-text-secondary inline-flex items-center gap-1.5 justify-center w-full">
            <a
              href={`https://whatsonchain.com/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 transition-colors"
            >
              {truncateHex(txid)}
            </a>
            <CopyButton text={txid} />
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <ShareButtons txid={txid} title={title} />

          <Link
            href={`/verify?txid=${txid}`}
            className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
          >
            Verify Your Version &rarr;
          </Link>

          {isOwner && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-th-text-muted hover:text-red-500 transition-colors"
                >
                  Delete Stamp
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <p className="text-sm text-red-500">Delete this stamp? This frees the text for others to claim.</p>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="shrink-0 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="shrink-0 text-sm text-th-text-muted hover:text-th-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
