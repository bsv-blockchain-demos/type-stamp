'use client'

import Link from 'next/link'
import ShareButtons from './ShareButtons'

interface CertificateCardProps {
  txid: string
  title: string
  content?: string
  identityKey: string
  timestamp: number
  blockheight?: number
  blocktime?: number
  confirmations?: number
}

export default function CertificateCard({
  txid,
  title,
  content,
  identityKey,
  timestamp,
  blockheight,
  blocktime,
  confirmations,
}: CertificateCardProps) {
  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="rounded-xl border border-th-border bg-th-surface overflow-hidden shadow-sm">
      {/* Badge */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center justify-between">
        <span className="text-emerald-500 text-sm font-medium">
          Verified on BSV Blockchain
        </span>
        {confirmations != null && confirmations > 0 && (
          <span className="text-xs text-th-text-muted">
            {confirmations} confirmation{confirmations !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Title */}
        <h1 className="text-xl font-semibold text-th-text">{title}</h1>

        {/* Content preview */}
        {content && (
          <div className="rounded-lg bg-th-surface-alt border border-th-border p-4 text-sm text-th-text-secondary whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {content}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-th-text-muted">Author</span>
            <p className="font-mono text-th-text-secondary text-xs break-all">{identityKey}</p>
          </div>
          <div>
            <span className="text-th-text-muted">Timestamp</span>
            <p className="text-th-text-secondary">{formatDate(timestamp)}</p>
          </div>
          {blockheight != null && blockheight > 0 && (
            <div>
              <span className="text-th-text-muted">Block Height</span>
              <p className="text-th-text-secondary">{blockheight.toLocaleString()}</p>
            </div>
          )}
          {blocktime != null && blocktime > 0 && (
            <div>
              <span className="text-th-text-muted">Block Time</span>
              <p className="text-th-text-secondary">{formatDate(blocktime)}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <span className="text-th-text-muted">TXID</span>
            <p className="font-mono text-th-text-secondary text-xs break-all">{txid}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <ShareButtons txid={txid} title={title} />
          <Link
            href={`/verify?txid=${txid}`}
            className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Verify Your Version &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
