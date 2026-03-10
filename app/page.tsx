import StampForm from '@/components/StampForm'
import PublicFeed from '@/components/PublicFeed'

export default function Home() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-1">ClaimStamp</h1>
        <p className="text-gray-400 text-sm mb-6">
          Timestamp your content on the BSV blockchain. Prove what you knew and when you knew it.
        </p>
        <StampForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Claims</h2>
        <PublicFeed />
      </section>
    </div>
  )
}
