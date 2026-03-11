interface OverlayPaginationProps {
  page: number
  totalPages: number
  total: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export default function OverlayPagination({
  page,
  totalPages,
  total,
  isLoading,
  onPageChange,
}: OverlayPaginationProps) {
  const pageSize = 20
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-th-text-muted">
        {total > 0
          ? `Showing ${startItem}\u2013${endItem} of ${total} stamp${total !== 1 ? 's' : ''}`
          : 'No stamps'}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="px-3 py-1.5 rounded-lg border border-th-border text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          &larr; Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              p === page
                ? 'border-orange-500 bg-orange-500/10 text-orange-500 font-medium'
                : 'border-th-border text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="px-3 py-1.5 rounded-lg border border-th-border text-th-text-secondary hover:text-th-text hover:bg-th-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  )
}
