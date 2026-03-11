interface OverlayHeroProps {
  blockHeight: number | null
  isConnected: boolean
}

export default function OverlayHero({ blockHeight, isConnected }: OverlayHeroProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-th-text">Overlay Network</h1>
      <p className="text-th-text-secondary mt-1">
        Live from the BSV Blockchain — not from Typestamp&apos;s database.
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm text-th-text-secondary bg-th-surface-alt px-4 py-2 rounded-full border border-th-border w-fit">
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
        <span className="text-th-text-muted">·</span>
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        {blockHeight !== null && (
          <>
            <span className="text-th-text-muted">·</span>
            <span>Block #{blockHeight.toLocaleString()}</span>
          </>
        )}
        <span className="text-th-text-muted">·</span>
        <span className="text-th-text-muted">Auto-refreshes every 30s</span>
      </div>
    </div>
  )
}
