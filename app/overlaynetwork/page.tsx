import type { Metadata } from 'next'
import NetworkFeed from '@/components/NetworkFeed'

export const metadata: Metadata = {
  title: 'Overlay Network — TypeStamp',
  description: 'Live stamp activity from the BSV Overlay Network',
}

export default function OverlayNetworkPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Overlay Network</h1>
        <p className="text-th-text-secondary text-sm mt-1">
          On-chain TypeStamp data sourced from the BSV Overlay Network
        </p>
      </div>
      <NetworkFeed />
    </main>
  )
}
