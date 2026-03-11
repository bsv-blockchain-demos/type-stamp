'use client'

import { useState, useEffect, useRef } from 'react'
import type { OverlayStamp } from './overlay/types'
import OverlayHero from './overlay/OverlayHero'
import OverlayStats from './overlay/OverlayStats'
import OverlayTrustBanner from './overlay/OverlayTrustBanner'
import OverlayEducation from './overlay/OverlayEducation'
import OverlayStampTable from './overlay/OverlayStampTable'
import OverlayPagination from './overlay/OverlayPagination'

export default function NetworkFeed() {
  const [stamps, setStamps] = useState<OverlayStamp[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [blockHeight, setBlockHeight] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeNodes, setActiveNodes] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = async (p: number) => {
    setIsLoading(true)
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
      setIsConnected(true)
    } else {
      console.error('Failed to load overlay stamps:', stampsResult.reason)
      setIsConnected(false)
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
    <div>
      <OverlayHero blockHeight={blockHeight} isConnected={activeNodes > 0} />
      <OverlayStats totalStamps={total} blockHeight={blockHeight} activeNodes={activeNodes} />
      <OverlayTrustBanner />
      <OverlayEducation />
      <OverlayStampTable stamps={stamps} isLoading={isLoading} />
      <OverlayPagination
        page={page}
        totalPages={totalPages}
        total={total}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </div>
  )
}
