'use client'

import { useCountUp } from './useCountUp'

interface OverlayStatsProps {
  totalStamps: number
  blockHeight: number | null
  activeNodes: number
}

const cardConfig = [
  { accent: 'green', borderClass: 'border-l-green-500', textClass: 'text-green-600', bgClass: 'bg-green-500/10' },
  { accent: 'purple', borderClass: 'border-l-purple-500', textClass: 'text-purple-600', bgClass: 'bg-purple-500/10' },
  { accent: 'blue', borderClass: 'border-l-blue-500', textClass: 'text-blue-600', bgClass: 'bg-blue-500/10' },
]

export default function OverlayStats({ totalStamps, blockHeight, activeNodes }: OverlayStatsProps) {
  const animNodes = useCountUp(activeNodes)
  const animStamps = useCountUp(totalStamps)
  const animBlock = useCountUp(blockHeight ?? 0)

  const cards = [
    {
      label: activeNodes === 1 ? 'Active Overlay Node' : 'Active Overlay Nodes',
      value: animNodes.toLocaleString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <circle cx="5" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="12" cy="19" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 5h10M6.5 6.5 11 17.5M17.5 6.5 13 17.5" />
        </svg>
      ),
    },
    {
      label: 'Stamps Indexed',
      value: animStamps.toLocaleString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
          <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
        </svg>
      ),
    },
    {
      label: 'Current Block',
      value: blockHeight !== null ? `${animBlock.toLocaleString()} ↑` : '—',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`rounded-xl border border-th-border border-l-4 ${cardConfig[i].borderClass} bg-th-surface p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}
          style={{ animation: `fade-in-up 500ms ease-out ${i * 100}ms both` }}
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            card.label.includes('Node') && activeNodes === 0
              ? 'bg-red-500/10 text-red-500'
              : `${cardConfig[i].bgClass} ${cardConfig[i].textClass}`
          }`}>
            {card.icon}
          </div>
          <div>
            <div className={`text-2xl font-bold ${cardConfig[i].textClass}`}>{card.value}</div>
            <div className="text-sm text-th-text-muted">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
