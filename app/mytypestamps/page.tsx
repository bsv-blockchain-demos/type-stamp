import MyTypeStampsList from '@/components/MyTypeStampsList'

export const metadata = {
  title: 'My Stamps — Typestamp',
  description: 'View and manage your stamps.',
}

export default function MyTypeStampsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <MyTypeStampsList />
    </div>
  )
}
