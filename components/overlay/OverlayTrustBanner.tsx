interface OverlayTrustBannerProps {
  blockHeight?: number | null
}

export default function OverlayTrustBanner({ blockHeight }: OverlayTrustBannerProps) {
  return (
    <div
      className="mb-8 rounded-xl bg-th-surface px-5 py-4 flex items-start gap-3 border border-th-border"
      style={{
        animation: 'fade-in-up 500ms ease-out both',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
      >
        <path
          fillRule="evenodd"
          d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="text-sm text-th-text-secondary">
          <strong className="text-th-text">Typestamp cannot modify or delete these records.</strong>{' '}
          This data is indexed directly from the BSV blockchain by an open overlay network.
          Anyone can run a node and see the same data independently.
        </p>
        {blockHeight != null && (
          <p className="text-xs text-th-text-muted mt-1.5">
            Currently verified against BSV block #{blockHeight.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
