'use client'

interface OverlayHeroProps {
  blockHeight: number | null
  isConnected: boolean
}

export default function OverlayHero({ blockHeight, isConnected }: OverlayHeroProps) {
  return (
    <div className="mb-8">
      <h1
        className="text-4xl sm:text-5xl font-bold text-th-text"
        style={{ animation: 'fade-in-up 600ms ease-out both' }}
      >
        Overlay Network
      </h1>
      <p
        className="text-lg text-th-text-secondary mt-2"
        style={{ animation: 'fade-in-up 500ms ease-out 300ms both' }}
      >
        Live from the BSV Blockchain — not from Typestamp&apos;s database.
      </p>

      <div
        className="mt-4 flex items-center gap-2 text-sm text-white dark:text-th-text bg-th-text/90 dark:bg-th-surface-alt px-4 py-2 rounded-full border border-th-border w-fit"
        style={{ animation: 'fade-in-up 500ms ease-out 500ms both' }}
      >
        <span className="relative flex h-2.5 w-2.5">
          {isConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          )}
        </span>
        <span>BSV Overlay Network</span>
        <span className="opacity-50">·</span>
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        {blockHeight !== null && (
          <>
            <span className="opacity-50">·</span>
            <span>Block #{blockHeight.toLocaleString()}</span>
          </>
        )}
        <span className="opacity-50">·</span>
        <span className="opacity-60">Auto-refreshes every 30s</span>
      </div>
    </div>
  )
}
