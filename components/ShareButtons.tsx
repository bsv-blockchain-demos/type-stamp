'use client'

import { useState } from 'react'
import { buildXShareUrl, buildLinkedInShareUrl } from '@/lib/share'

interface ShareButtonsProps {
  txid: string
  title: string
}

export default function ShareButtons({ txid, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const claimUrl = `${appUrl}/c/${txid}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(claimUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={buildXShareUrl(txid, title, appUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm bg-th-surface-alt border border-th-border hover:border-th-border-hover text-th-text-secondary hover:text-th-text px-4 py-2 rounded-lg transition-colors"
      >
        Share on X
      </a>
      <a
        href={buildLinkedInShareUrl(txid, appUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm bg-th-surface-alt border border-th-border hover:border-th-border-hover text-th-text-secondary hover:text-th-text px-4 py-2 rounded-lg transition-colors"
      >
        Share on LinkedIn
      </a>
      <button
        onClick={handleCopy}
        className="text-sm bg-th-surface-alt border border-th-border hover:border-th-border-hover text-th-text-secondary hover:text-th-text px-4 py-2 rounded-lg transition-colors"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
