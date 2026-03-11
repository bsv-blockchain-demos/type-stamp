'use client'

import { useRouter } from 'next/navigation'
import type { OverlayStamp } from './types'

interface OverlayStampTableProps {
  stamps: OverlayStamp[]
  isLoading: boolean
  prevTxids?: Set<string>
}

function formatDateTime(ts: number) {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

export default function OverlayStampTable({ stamps, isLoading, prevTxids }: OverlayStampTableProps) {
  const router = useRouter()
  const nowSec = Date.now() / 1000

  if (isLoading && stamps.length === 0) {
    return (
      <div className="text-center text-th-text-muted py-8">
        Loading overlay stamps...
      </div>
    )
  }

  if (!isLoading && stamps.length === 0) {
    return (
      <div className="text-center text-th-text-muted py-8">
        No stamps indexed by the overlay yet. Create one to get started!
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-th-border shadow-sm">
      <table className="w-full table-fixed text-sm text-left">
        <thead className="bg-th-surface text-th-text-muted text-xs uppercase tracking-wider border-b-2 border-b-orange-500/30">
          <tr>
            <th className="px-3 py-3 w-[26%]">Typestamp</th>
            <th className="px-3 py-3 w-[12%]">Author</th>
            <th className="px-3 py-3 w-[13%]">Identity Key</th>
            <th className="px-3 py-3 w-[13%]">TXID</th>
            <th className="px-3 py-3 w-[9%]">Block</th>
            <th className="px-3 py-3 w-[24%]">Created At</th>
            <th className="px-2 py-3 w-[3%]"><span className="sr-only">Go</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-th-border">
          {stamps.map(s => {
            const isNew = nowSec - s.timestamp < 600
            const isFlash = prevTxids && !prevTxids.has(s.txid)

            return (
              <tr
                key={`${s.txid}-${s.outputIndex}`}
                className="bg-th-bg border-l-2 border-l-transparent hover:border-l-orange-500 hover:bg-orange-500/5 transition-colors cursor-pointer"
                style={isFlash ? { animation: 'flash-new 1s ease-out' } : undefined}
                onClick={() => router.push(`/c/${s.txid}`)}
              >
                <td className="px-3 py-3 truncate text-th-text">
                  <span className="inline-flex items-center gap-2">
                    {s.isSealed ? (
                      <span className="inline-flex items-center gap-1 text-gray-400 italic">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        Sealed
                      </span>
                    ) : (
                      <span className="truncate">{s.title}</span>
                    )}
                    {isNew && (
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        NEW
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-3 truncate text-th-text-secondary">
                  {s.displayName || '\u2014'}
                </td>
                <td className="px-3 py-3 truncate font-mono text-xs text-th-text-muted">
                  {s.identityKey && s.identityKey !== 'unknown'
                    ? `${s.identityKey.slice(0, 6)}...${s.identityKey.slice(-4)}`
                    : '\u2014'}
                </td>
                <td className="px-3 py-3 font-mono text-xs">
                  <a
                    href={`https://whatsonchain.com/tx/${s.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {s.txid.slice(0, 6)}...{s.txid.slice(-4)}
                  </a>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-th-text-muted">
                  {s.blockHeight != null ? `#${s.blockHeight.toLocaleString()}` : '\u2014'}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-th-text-muted">
                  {formatDateTime(s.timestamp)}
                </td>
                <td className="px-2 py-3 text-th-text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
