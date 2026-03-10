'use client'

import Link from 'next/link'
import { useWallet } from './WalletProvider'

export default function Header() {
  const { identityKey, isConnected, isLoading, connect } = useWallet()

  const truncatedKey = identityKey
    ? `${identityKey.slice(0, 6)}...${identityKey.slice(-4)}`
    : ''

  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            ClaimStamp
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/verify" className="text-gray-400 hover:text-white transition-colors">
              Verify
            </Link>
            <Link href="/myclaimstamps" className="text-gray-400 hover:text-white transition-colors">
              My Claims
            </Link>
          </nav>
        </div>

        <div>
          {isLoading ? (
            <span className="text-sm text-gray-500">Connecting...</span>
          ) : isConnected ? (
            <span className="text-sm text-emerald-400 font-mono bg-gray-900 px-3 py-1.5 rounded-lg">
              {truncatedKey}
            </span>
          ) : (
            <button
              onClick={connect}
              className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
