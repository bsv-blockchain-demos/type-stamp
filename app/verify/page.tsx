import { Suspense } from 'react'
import VerifyForm from '@/components/VerifyForm'

export const metadata = {
  title: 'Verify — Typestamp',
  description: 'Verify content against an on-chain typestamp. No wallet needed.',
}

export default function VerifyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1
          className="text-4xl sm:text-5xl font-bold text-th-text"
          style={{ animation: 'fade-in-up 600ms ease-out both' }}
        >
          Verify
        </h1>
        <p
          className="text-lg text-th-text-secondary mt-2"
          style={{ animation: 'fade-in-up 500ms ease-out 200ms both' }}
        >
          Prove that a piece of text existed at a specific point in time.
        </p>
        <div style={{ animation: 'fade-in-up 500ms ease-out 400ms both' }}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full mt-3">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            No wallet required
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        style={{ animation: 'fade-in-up 500ms ease-out 500ms both' }}
      >
        <div className="rounded-xl border border-th-border border-l-4 border-l-blue-500 bg-th-surface p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <h3 className="text-sm font-semibold text-th-text mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Verify a Public Stamp
          </h3>
          <p className="text-xs text-th-text-muted leading-relaxed">
            Enter the TXID. The on-chain content is verified automatically.
          </p>
        </div>
        <div className="rounded-xl border border-th-border border-l-4 border-l-gray-400 bg-th-surface p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <h3 className="text-sm font-semibold text-th-text mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Verify a Sealed Stamp
          </h3>
          <p className="text-xs text-th-text-muted leading-relaxed">
            Enter the TXID and the original private text. We hash it locally and compare to the on-chain hash.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-th-text-muted">Loading...</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
