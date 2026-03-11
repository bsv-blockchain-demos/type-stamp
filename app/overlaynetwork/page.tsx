import type { Metadata } from 'next'
import NetworkFeed from '@/components/NetworkFeed'

export const metadata: Metadata = {
  title: 'Typestamp',
}

export default function OverlayNetworkPage() {
  return <NetworkFeed />
}
