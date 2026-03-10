import MyClaimsList from '@/components/MyClaimsList'

export const metadata = {
  title: 'My Claims — ClaimStamp',
  description: 'View and manage your ClaimStamp claims.',
}

export default function MyClaimsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">My Claims</h1>
      <p className="text-gray-400 text-sm mb-6">
        View all your claims and toggle their visibility.
      </p>
      <MyClaimsList />
    </div>
  )
}
