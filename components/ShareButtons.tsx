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

  const btnClass = "flex-1 text-center text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/20"

  return (
    <div className="grid grid-cols-3 gap-2">
      <a
        href={buildXShareUrl(txid, title, appUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        Share on X
      </a>
      <a
        href={buildLinkedInShareUrl(txid, appUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        Share on LinkedIn
      </a>
      <button
        onClick={handleCopy}
        className={btnClass}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
