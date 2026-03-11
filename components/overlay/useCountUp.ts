'use client'

import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 800): number {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (target === 0 || hasAnimated.current) {
      if (hasAnimated.current) setDisplay(target)
      return
    }

    hasAnimated.current = true
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [target, duration])

  return display
}
