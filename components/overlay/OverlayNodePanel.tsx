interface NodeStat {
  url: string
  stamps: number
}

interface OverlayNodePanelProps {
  activeNodes: number
  blockHeight: number | null
  totalStamps: number
  nodeUrls: string[]
  nodeStats: NodeStat[]
}

export default function OverlayNodePanel({ activeNodes, blockHeight, nodeUrls, nodeStats }: OverlayNodePanelProps) {
  return (
    <div style={{ animation: 'fade-in-up 500ms ease-out both' }}>
      {/* Divider label */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 h-px bg-th-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-th-text-muted">Connected Overlay Nodes</span>
        <div className="flex-1 h-px bg-th-border" />
      </div>

      {/* Node panel */}
      <div className="rounded-xl border border-th-border bg-th-surface p-4">
        {activeNodes === 0 ? (
          <div className="text-sm text-th-text-muted text-center py-2">
            No overlay nodes currently connected.
          </div>
        ) : (
          <div className="space-y-3">
            {nodeUrls.map((url, i) => {
              const host = url.replace(/^https?:\/\//, '')
              const stat = nodeStats.find(s => s.url === url)
              return (
                <div key={url} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-th-text">Overlay Node {i + 1}</div>
                      <div className="text-xs font-mono text-th-text-muted">{host}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-th-text-secondary">
                    {stat && stat.stamps > 0 && (
                      <div>
                        <span className="text-th-text-muted">Stamps:</span>{' '}
                        <span className="font-medium text-th-text">{stat.stamps.toLocaleString()}</span>
                      </div>
                    )}
                    {blockHeight != null && (
                      <div>
                        <span className="text-th-text-muted">Block:</span>{' '}
                        <span className="font-medium text-th-text">#{blockHeight.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-th-border">
          <a
            href="https://hub.bsvblockchain.org/bsv-skills-center/network-topology/overlay-services"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-500 hover:text-orange-400 transition-colors font-medium"
          >
            + Run your own node &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
