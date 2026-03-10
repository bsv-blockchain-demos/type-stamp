'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWallet } from './WalletProvider'
import ThemeToggle from './ThemeToggle'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/mytypestamps', label: 'My Stamps' },
  { href: '/verify', label: 'Verify' },
  { href: '/receive', label: 'Receive' },
]

export default function Header() {
  const pathname = usePathname()
  const { identityKey, isConnected, isLoading, connect } = useWallet()

  const truncatedKey = identityKey
    ? `${identityKey.slice(0, 6)}...${identityKey.slice(-4)}`
    : ''

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/mytypestamps') return pathname.startsWith('/mytypestamps') || pathname.startsWith('/c/')
    return pathname.startsWith(href)
  }

  return (
    <header className="border-b border-th-border bg-th-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            TypeStamp
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive(href)
                    ? 'bg-orange-500/10 text-orange-500 font-medium'
                    : 'text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoading ? (
            <span className="text-sm text-th-text-muted">Connecting...</span>
          ) : isConnected ? (
            <span className="text-sm text-orange-500 font-mono bg-th-surface-alt px-3 py-1.5 rounded-lg border border-th-border">
              {truncatedKey}
            </span>
          ) : (
            <button
              onClick={connect}
              className="text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-1.5 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
