import StampForm from '@/components/StampForm'
import PublicFeed from '@/components/PublicFeed'

export default function Home() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-1">TypeStamp</h1>
        <p className="text-th-text-secondary text-sm mb-6">
          Stake your claim on any text. Immutable. Timestamped. Yours.
        </p>
        <StampForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Public Registry</h2>
        <PublicFeed />
      </section>
    </div>
  )
}
