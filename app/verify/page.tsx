import { Suspense } from 'react'
import VerifyForm from '@/components/VerifyForm'

export const metadata = {
  title: 'Verify — Typestamp',
  description: 'Verify content against an on-chain typestamp. No wallet needed.',
}

export default function VerifyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Verify</h1>
      <p className="text-th-text-secondary text-sm">
        Prove that a piece of text existed at a specific point in time.
      </p>
      <p className="text-th-text-muted text-sm mb-6">
        No wallet required — anyone can verify any stamp independently.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <h3 className="text-sm font-semibold text-th-text mb-1">Verify a Public Stamp</h3>
          <p className="text-xs text-th-text-muted leading-relaxed">
            Enter the TXID. The on-chain content is verified automatically.
          </p>
        </div>
        <div className="rounded-xl border border-th-border bg-th-surface p-5">
          <h3 className="text-sm font-semibold text-th-text mb-1">Verify a Sealed Stamp</h3>
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
