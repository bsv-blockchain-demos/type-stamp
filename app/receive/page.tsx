import ReceiveInfo from '@/components/ReceiveInfo'

export const metadata = {
  title: 'Receive — TypeStamp',
  description: 'Share your identity key or legacy address to receive typestamps and tokens.',
}

export default function ReceivePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Receive</h1>
      <p className="text-th-text-secondary text-sm mb-6">
        Share your identity key or legacy address so others can send you typestamps or tokens.
      </p>
      <ReceiveInfo />
    </div>
  )
}
