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
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Badge */}
      <div className="bg-emerald-900/30 border-b border-emerald-800/50 px-6 py-3 flex items-center justify-between">
        <span className="text-emerald-400 text-sm font-medium">
          Verified on BSV Blockchain
        </span>
        {confirmations != null && confirmations > 0 && (
          <span className="text-xs text-gray-400">
            {confirmations} confirmation{confirmations !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Title */}
        <h1 className="text-xl font-semibold text-white">{title}</h1>

        {/* Content preview */}
        {content && (
          <div className="rounded-lg bg-gray-800 p-4 text-sm text-gray-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {content}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Author</span>
            <p className="font-mono text-gray-300 text-xs break-all">{identityKey}</p>
          </div>
          <div>
            <span className="text-gray-500">Timestamp</span>
            <p className="text-gray-300">{formatDate(timestamp)}</p>
          </div>
          {blockheight != null && blockheight > 0 && (
            <div>
              <span className="text-gray-500">Block Height</span>
              <p className="text-gray-300">{blockheight.toLocaleString()}</p>
            </div>
          )}
          {blocktime != null && blocktime > 0 && (
            <div>
              <span className="text-gray-500">Block Time</span>
              <p className="text-gray-300">{formatDate(blocktime)}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <span className="text-gray-500">TXID</span>
            <p className="font-mono text-gray-300 text-xs break-all">{txid}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <ShareButtons txid={txid} title={title} />
          <Link
            href={`/verify?txid=${txid}`}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Verify Your Version &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
