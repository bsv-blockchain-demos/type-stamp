export default function OverlayEducation() {
  return (
    <div className="mb-8 rounded-xl border border-th-border bg-th-surface p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-th-text mb-2">
          What is the BSV Overlay Network?
        </h2>
        <p className="text-sm text-th-text-secondary leading-relaxed">
          An overlay network is a distributed system that indexes specific transaction data from the
          BSV blockchain. Instead of trusting a single database, overlay nodes independently verify
          and serve the same on-chain data — making it tamper-proof and censorship-resistant.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <a
            href="https://docs.bsvblockchain.org/overlay-services/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
          >
            View docs &rarr;
          </a>
          <a
            href="https://docs.bsvblockchain.org/overlay-services/running-a-node"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
          >
            Run your own node &rarr;
          </a>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
        {/* BSV Blockchain */}
        <div className="flex-1 w-full rounded-lg border border-th-border bg-th-bg p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M1 12.5A4.5 4.5 0 005.5 17H15a4 4 0 001.866-7.539 3.504 3.504 0 00-4.504-4.272A4.5 4.5 0 004.06 8.235 4.502 4.502 0 001 12.5z" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-th-text">BSV Blockchain</div>
          <div className="text-xs text-th-text-muted mt-1">Permanent record — nobody controls it</div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-th-text-muted sm:mx-2">
          <svg className="w-6 h-6 hidden sm:block" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <svg className="w-6 h-6 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
          </svg>
        </div>

        {/* Overlay Node */}
        <div className="flex-1 w-full rounded-lg border border-th-border bg-th-bg p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M4.632 3.533A2 2 0 016.577 2h6.846a2 2 0 011.945 1.533l1.976 8.234A3.489 3.489 0 0016 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234z" />
              <path fillRule="evenodd" d="M4 13a2 2 0 100 4h12a2 2 0 100-4H4zm11.24 2a.75.75 0 01.75-.75H16a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V15zm-2.25-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75h-.01z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-th-text">Overlay Node</div>
          <div className="text-xs text-th-text-muted mt-1">Distributed indexer — anyone can run one</div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-th-text-muted sm:mx-2">
          <svg className="w-6 h-6 hidden sm:block" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <svg className="w-6 h-6 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
          </svg>
        </div>

        {/* TypeStamp App */}
        <div className="flex-1 w-full rounded-lg border-2 border-orange-500 bg-th-bg p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-orange-500">Typestamp App</div>
          <div className="text-xs text-th-text-muted mt-1">Displays blockchain-verified data</div>
        </div>
      </div>
    </div>
  )
}
