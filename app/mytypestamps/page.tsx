import MyTypeStampsList from '@/components/MyTypeStampsList'

export const metadata = {
  title: 'My TypeStamps — TypeStamp',
  description: 'View and manage your typestamps.',
}

export default function MyTypeStampsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">My TypeStamps</h1>
      <p className="text-th-text-secondary text-sm mb-6">
        View all your typestamps and toggle their visibility.
      </p>
      <MyTypeStampsList />
    </div>
  )
}
