'use client'

import Link from 'next/link'
import { useWallet } from './WalletProvider'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { identityKey, isConnected, isLoading, connect } = useWallet()

  const truncatedKey = identityKey
    ? `${identityKey.slice(0, 6)}...${identityKey.slice(-4)}`
    : ''

  return (
    <header className="border-b border-th-border bg-th-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent">
            TypeStamp
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/" className="text-th-text-secondary hover:text-th-text transition-colors">
              Home
            </Link>
            <Link href="/mytypestamps" className="text-th-text-secondary hover:text-th-text transition-colors">
              My TypeStamps
            </Link>
            <Link href="/verify" className="text-th-text-secondary hover:text-th-text transition-colors">
              Verify
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoading ? (
            <span className="text-sm text-th-text-muted">Connecting...</span>
          ) : isConnected ? (
            <span className="text-sm text-emerald-500 font-mono bg-th-surface-alt px-3 py-1.5 rounded-lg border border-th-border">
              {truncatedKey}
            </span>
          ) : (
            <button
              onClick={connect}
              className="text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-4 py-1.5 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
