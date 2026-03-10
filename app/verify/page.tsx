import { Suspense } from 'react'
import VerifyForm from '@/components/VerifyForm'

export const metadata = {
  title: 'Verify — ClaimStamp',
  description: 'Verify content against an on-chain ClaimStamp. No wallet needed.',
}

export default function VerifyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Verify a Claim</h1>
      <p className="text-gray-400 text-sm mb-6">
        Paste a TXID and the original content to verify it matches the on-chain hash. No wallet required.
      </p>
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
