export default function OverlayEducation() {
  return (
    <div className="mb-8 rounded-xl border border-th-border bg-th-surface p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-th-text mb-2">
          What is a BSV Overlay Network?
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
              <path d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z" />
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <line x1="4" y1="4" x2="16" y2="4" /><line x1="4" y1="4" x2="10" y2="10" /><line x1="16" y1="4" x2="10" y2="10" /><line x1="4" y1="4" x2="4" y2="16" /><line x1="16" y1="4" x2="16" y2="16" /><line x1="10" y1="10" x2="4" y2="16" /><line x1="10" y1="10" x2="16" y2="16" /><line x1="4" y1="16" x2="16" y2="16" />
              <circle cx="4" cy="4" r="2" fill="currentColor" stroke="none" /><circle cx="16" cy="4" r="2" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="2" fill="currentColor" stroke="none" /><circle cx="4" cy="16" r="2" fill="currentColor" stroke="none" /><circle cx="16" cy="16" r="2" fill="currentColor" stroke="none" />
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
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-orange-500">Typestamp App</div>
          <div className="text-xs text-th-text-muted mt-1">Displays blockchain-verified data</div>
        </div>
      </div>
    </div>
  )
}
