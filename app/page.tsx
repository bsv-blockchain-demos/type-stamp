import StampForm from '@/components/StampForm'
import PublicFeed from '@/components/PublicFeed'

export default function Home() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-1">TypeStamp</h1>
        <p className="text-th-text-secondary text-sm mb-6">
          Typestamp any text &mdash; an idea, a quote, a phrase, a prediction, a trademark,
          or anything else you want to tokenize and timestamp immediately on the blockchain. TypeStamp
          creates a tamper-proof, timestamped record so you can prove what you said and when you said it.
        </p>
        <StampForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Unique Public TypeStamps</h2>
        <PublicFeed />
      </section>
    </div>
  )
}
