'use client'

import { useState, useEffect, useRef } from 'react'
import type { OverlayStamp } from './overlay/types'
import OverlayHero from './overlay/OverlayHero'
import OverlayStats from './overlay/OverlayStats'
import OverlayTrustBanner from './overlay/OverlayTrustBanner'
import OverlayEducation from './overlay/OverlayEducation'
import OverlayNodePanel from './overlay/OverlayNodePanel'
import OverlayStampTable from './overlay/OverlayStampTable'
import OverlayPagination from './overlay/OverlayPagination'

export default function NetworkFeed() {
  const [stamps, setStamps] = useState<OverlayStamp[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [blockHeight, setBlockHeight] = useState<number | null>(null)
  const [activeNodes, setActiveNodes] = useState(0)
  const [nodeUrls, setNodeUrls] = useState<string[]>([])
  const [nodeStats, setNodeStats] = useState<{ url: string; stamps: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevTxidsRef = useRef<Set<string> | undefined>(undefined)

  const loadData = async (p: number) => {
    setIsLoading(true)

    // Snapshot current txids before fetching new data
    if (stamps.length > 0) {
      prevTxidsRef.current = new Set(stamps.map(s => s.txid))
    }

    const wocBase = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'

    const [stampsResult, chainResult] = await Promise.allSettled([
      fetch(`/api/overlay/stamps?page=${p}`).then(r => r.json()),
      fetch(`${wocBase}/chain/info`).then(r => r.json()),
    ])

    if (stampsResult.status === 'fulfilled') {
      setStamps(stampsResult.value.stamps)
      setTotalPages(stampsResult.value.totalPages)
      setTotal(stampsResult.value.total)
      setActiveNodes(stampsResult.value.activeNodes ?? 0)
      setNodeUrls(stampsResult.value.nodeUrls ?? [])
      setNodeStats(stampsResult.value.nodeStats ?? [])
    } else {
      console.error('Failed to load overlay stamps:', stampsResult.reason)
      setActiveNodes(0)
      setNodeUrls([])
    }

    if (chainResult.status === 'fulfilled') {
      setBlockHeight(chainResult.value.blocks)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadData(page)
  }, [page])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData(page)
    }, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [page])

  return (
    <div className="space-y-12">
      <div>
        <OverlayHero blockHeight={blockHeight} isConnected={activeNodes > 0} />
        <OverlayStats totalStamps={total} blockHeight={blockHeight} activeNodes={activeNodes} />
      </div>

      <OverlayEducation />

      <OverlayNodePanel activeNodes={activeNodes} blockHeight={blockHeight} totalStamps={total} nodeUrls={nodeUrls} nodeStats={nodeStats} />

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-th-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-th-text-muted">Public Overlay Registry</span>
          <div className="flex-1 h-px bg-th-border" />
        </div>
        <OverlayStampTable stamps={stamps} isLoading={isLoading} prevTxids={prevTxidsRef.current} />
        <OverlayPagination
          page={page}
          totalPages={totalPages}
          total={total}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>

      <OverlayTrustBanner blockHeight={blockHeight} />
    </div>
  )
}
