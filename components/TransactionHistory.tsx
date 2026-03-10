'use client'

import { useState, useEffect } from 'react'

interface TxInput {
  txid: string
  vout: number
  scriptSig?: { asm: string }
  coinbase?: string
}

interface TxOutput {
  value: number
  n: number
  scriptPubKey: {
    addresses?: string[]
    type: string
  }
}

interface TxDetails {
  txid: string
  vin: TxInput[]
  vout: TxOutput[]
  blockheight?: number
  blocktime?: number
  confirmations?: number
  time?: number
}

export default function TransactionHistory({ txid }: { txid: string }) {
  const [tx, setTx] = useState<TxDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const wocBase = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'
    fetch(`${wocBase}/tx/hash/${txid}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch transaction')
        return res.json()
      })
      .then(data => setTx(data))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [txid])

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

  const truncate = (s: string) => `${s.slice(0, 8)}...${s.slice(-8)}`

  if (isLoading) {
    return (
      <div className="text-center text-th-text-muted py-6 text-sm">
        Loading transaction details...
      </div>
    )
  }

  // Hide error state entirely
  if (error || !tx) {
    return null
  }

  return (
    <div className="rounded-xl border border-th-border bg-th-surface overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-3 border-b border-th-border bg-th-surface-alt flex items-center justify-between hover:bg-th-surface transition-colors"
      >
        <h2 className="text-sm font-semibold text-th-text">Transaction Details</h2>
        <svg
          className={`w-4 h-4 text-th-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="p-6 space-y-6">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-th-text-muted text-xs">Status</span>
              <p className={`font-medium ${tx.confirmations && tx.confirmations > 0 ? 'text-orange-500' : 'text-th-text-secondary'}`}>
                {tx.confirmations && tx.confirmations > 0 ? 'Confirmed' : 'Unconfirmed'}
              </p>
            </div>
            <div>
              <span className="text-th-text-muted text-xs">Confirmations</span>
              <p className="text-th-text-secondary font-medium">{tx.confirmations?.toLocaleString() ?? '0'}</p>
            </div>
            <div>
              <span className="text-th-text-muted text-xs">Block</span>
              <p className="text-th-text-secondary font-medium">{tx.blockheight?.toLocaleString() ?? 'Pending'}</p>
            </div>
            <div>
              <span className="text-th-text-muted text-xs">Time</span>
              <p className="text-th-text-secondary font-medium">{tx.blocktime ? formatDate(tx.blocktime) : tx.time ? formatDate(tx.time) : 'Pending'}</p>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-2">
              Inputs ({tx.vin.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-th-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-th-surface-alt text-th-text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Source TXID</th>
                    <th className="px-4 py-2">Output Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {tx.vin.map((input, i) => (
                    <tr key={i} className="bg-th-bg">
                      <td className="px-4 py-2 text-th-text-muted">{i}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {input.coinbase ? (
                          <span className="text-th-text-muted italic">Coinbase</span>
                        ) : (
                          <a
                            href={`https://whatsonchain.com/tx/${input.txid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:text-orange-400 transition-colors"
                          >
                            {truncate(input.txid)}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-2 text-th-text-secondary">{input.coinbase ? '-' : input.vout}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <h3 className="text-xs font-semibold text-th-text-muted uppercase tracking-wider mb-2">
              Outputs ({tx.vout.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-th-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-th-surface-alt text-th-text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2 text-right">Value (BSV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {tx.vout.map(output => (
                    <tr key={output.n} className="bg-th-bg">
                      <td className="px-4 py-2 text-th-text-muted">{output.n}</td>
                      <td className="px-4 py-2 font-mono text-xs text-th-text-secondary">
                        {output.scriptPubKey.addresses?.[0]
                          ? truncate(output.scriptPubKey.addresses[0])
                          : <span className="italic text-orange-500">{output.scriptPubKey.type === 'nonstandard' ? 'TypeStamp Token' : output.scriptPubKey.type}</span>
                        }
                      </td>
                      <td className="px-4 py-2 text-right text-th-text-secondary">{output.value.toFixed(8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WoC link */}
          <div className="pt-2 text-center">
            <a
              href={`https://whatsonchain.com/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
            >
              View full transaction on WhatsOnChain &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
