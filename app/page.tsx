import StampForm from '@/components/StampForm'
import PublicFeed from '@/components/PublicFeed'

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-2xl font-bold mb-1">TypeStamp</h1>
        <p className="text-th-text-secondary text-sm mb-6">
          The first to stamp it owns the record. Immutable. Irrefutable. Permanent.
        </p>
        <StampForm />
      </section>

      <hr className="border-th-border" />

      <section>
        <h2 className="text-xl font-bold mb-1 text-center">Public Registry</h2>
        <p className="text-th-text-muted text-sm mb-6 text-center">Recently stamped by the community</p>
        <PublicFeed />
      </section>
    </div>
  )
}
