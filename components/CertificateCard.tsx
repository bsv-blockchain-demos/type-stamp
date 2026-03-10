'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import ShareButtons from './ShareButtons'
import { useWallet } from './WalletProvider'
import { transferTypeStamp } from '@/lib/attest'

interface CertificateCardProps {
  txid: string
  title: string
  content?: string
  identityKey: string
  displayName?: string
  showIdentityKey?: boolean
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
  timestamp,
  blockheight,
  confirmations,
}: CertificateCardProps) {
  const { identityKey: walletIdentityKey } = useWallet()
  const isOwner = walletIdentityKey === identityKey
  const [showSendForm, setShowSendForm] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [liveConfirmations, setLiveConfirmations] = useState(confirmations)
  const [liveBlockheight, setLiveBlockheight] = useState(blockheight)

  const isPending = !liveConfirmations || liveConfirmations <= 0
  const searchParams = useSearchParams()

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
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const handleSend = async () => {
    setSendError(null)
    setSendSuccess(null)
    const trimmed = recipient.trim()
    if (!trimmed) {
      setSendError('Please enter a recipient identity key.')
      return
    }
    if (!/^[0-9a-fA-F]{66}$/.test(trimmed)) {
      setSendError('Invalid identity key. Must be a 66-character hex public key.')
      return
    }
    setIsSending(true)
    try {
      const { newTxid } = await transferTypeStamp(txid, trimmed)
      setSendSuccess(`Sent! New TXID: ${newTxid}`)
      setShowSendForm(false)
      setRecipient('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Transfer failed.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCancelSend = () => {
    setShowSendForm(false)
    setRecipient('')
    setSendError(null)
    setSendSuccess(null)
  }

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
        <blockquote className="text-2xl sm:text-3xl font-bold text-th-text leading-snug text-center">
          &ldquo;{content || title}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="text-center space-y-1">
          {displayName ? (
            <>
              <p className="text-sm font-medium text-th-text">{displayName}</p>
              {showIdentityKey && (
                <p className="text-xs text-th-text-muted font-mono inline-flex items-center gap-1.5">
                  {truncateHex(identityKey)}
                  <CopyButton text={identityKey} />
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-th-text-muted font-mono inline-flex items-center gap-1.5">
              {truncateHex(identityKey)}
              <CopyButton text={identityKey} />
            </p>
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

          {isOwner && !showSendForm && !sendSuccess && (
            <button
              onClick={() => setShowSendForm(true)}
              className="w-full py-2 rounded-lg border border-orange-500/30 text-orange-500 font-medium text-sm hover:bg-orange-500/10 transition-all"
            >
              Send Token
            </button>
          )}

          {sendSuccess && (
            <p className="text-sm text-green-500 text-center">{sendSuccess}</p>
          )}

          {isOwner && showSendForm && (
            <div className="rounded-lg border border-th-border bg-th-surface-alt p-4 space-y-3">
              <label className="block text-sm font-medium text-th-text">
                Recipient
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value)
                  setSendError(null)
                  setSendSuccess(null)
                }}
                placeholder="Enter recipient identity key (66-char hex)"
                className="w-full rounded-lg border border-th-border bg-th-surface px-3 py-2 text-sm text-th-text placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              {sendError && (
                <p className="text-sm text-red-500">{sendError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
                >
                  {isSending ? 'Sending…' : 'Send'}
                </button>
                <button
                  onClick={handleCancelSend}
                  className="flex-1 py-2 rounded-lg border border-th-border text-th-text text-sm hover:bg-th-surface-alt transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <Link
            href={`/verify?txid=${txid}`}
            className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
          >
            Verify Your Version &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
