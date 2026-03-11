'use client'

import StampForm from '@/components/StampForm'
import RecentStampsTeaser from '@/components/RecentStampsTeaser'

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <h1
          className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent pb-1"
          style={{ animation: 'fade-in-up 600ms ease-out both' }}
        >
          Typestamp
        </h1>
        <p
          className="text-th-text-secondary text-sm mt-4"
          style={{ animation: 'fade-in-up 500ms ease-out 300ms both' }}
        >
          The first to stamp it owns the record.
        </p>
        <div className="mt-2 flex justify-center gap-3 text-sm font-medium text-th-text-muted">
          {['Immutable.', 'Irrefutable.', 'Permanent.'].map((word, i) => (
            <span
              key={word}
              style={{ animation: `fade-in-up 500ms ease-out ${450 + i * 150}ms both` }}
            >
              {word}
            </span>
          ))}
        </div>
        <div
          className="mt-8"
          style={{ animation: 'fade-in-scale 400ms ease-out 800ms both' }}
        >
          <StampForm />
        </div>
      </section>

      <RecentStampsTeaser />
    </div>
  )
}
