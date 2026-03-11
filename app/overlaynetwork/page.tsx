import type { Metadata } from 'next'
import NetworkFeed from '@/components/NetworkFeed'

export const metadata: Metadata = {
  title: 'Overlay Network — Typestamp',
  description: 'Live stamp activity from the BSV Overlay Network',
}

export default function OverlayNetworkPage() {
  return <NetworkFeed />
}
