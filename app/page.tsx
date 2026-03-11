import StampForm from '@/components/StampForm'
import RecentStampsTeaser from '@/components/RecentStampsTeaser'

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-2xl font-bold mb-1">Typestamp</h1>
        <p className="text-th-text-secondary text-sm mb-6">
          The first to stamp it owns the record. Immutable. Irrefutable. Permanent.
        </p>
        <StampForm />
      </section>

      <hr className="border-th-border" />

      <RecentStampsTeaser />
    </div>
  )
}
