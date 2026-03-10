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
    <div className="flex gap-2">
      <a
        href={buildXShareUrl(txid, title, appUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-all"
      >
        Share on X
      </a>
      <a
        href={buildLinkedInShareUrl(txid, appUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-all"
      >
        Share on LinkedIn
      </a>
      <button
        onClick={handleCopy}
        className="flex-1 text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-all"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
