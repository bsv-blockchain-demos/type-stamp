'use client'

import { useState } from 'react'
import { useWallet } from './WalletProvider'
import { PublicKey } from '@bsv/sdk'

function RevealCard({
  label,
  description,
  value,
}: {
  label: string
  description: string
  value: string
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-th-border bg-th-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-1">{label}</h2>
      <p className="text-th-text-secondary text-sm mb-4">{description}</p>

      {revealed ? (
        <>
          <div className="rounded-lg bg-th-surface-alt border border-th-border px-4 py-3 font-mono text-sm text-th-text break-all mb-3">
            {value}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-1.5 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setRevealed(false)}
              className="text-sm border border-th-border text-th-text-secondary hover:text-th-text px-4 py-1.5 rounded-lg transition-colors"
            >
              Hide
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-1.5 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          Reveal
        </button>
      )}
    </div>
  )
}

export default function ReceiveInfo() {
  const { identityKey, isConnected, connect } = useWallet()

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-th-border bg-th-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-th-text-secondary mb-4 text-sm">
          Connect a BSV wallet to view your receiving details.
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

  const legacyAddress = identityKey
    ? PublicKey.fromString(identityKey).toAddress()
    : ''

  return (
    <div className="space-y-4">
      <RevealCard
        label="Identity Key"
        description="Share this with someone who wants to send you typestamps via identity key."
        value={identityKey || ''}
      />
      <RevealCard
        label="Legacy Address"
        description="Share this BSV address to receive tokens."
        value={legacyAddress}
      />
    </div>
  )
}
