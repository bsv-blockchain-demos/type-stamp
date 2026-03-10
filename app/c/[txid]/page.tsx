import { Metadata } from 'next'
import CertificateCard from '@/components/CertificateCard'
import TransactionHistory from '@/components/TransactionHistory'

interface Props {
  params: { txid: string }
}

async function getTypeStamp(txid: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${appUrl}/api/typestamps/${txid}`, {
      cache: 'no-store',
    })
    if (res.ok) return res.json()
  } catch {
    // fallback to WoC
  }
  return null
}

async function getOnChainData(txid: string) {
  const wocBase = process.env.NEXT_PUBLIC_WOC_BASE || 'https://api.whatsonchain.com/v1/bsv/main'
  try {
    const [detailRes, rawRes] = await Promise.all([
      fetch(`${wocBase}/tx/hash/${txid}`),
      fetch(`${wocBase}/tx/${txid}/hex`),
    ])
    const details = detailRes.ok ? await detailRes.json() : null
    const rawHex = rawRes.ok ? await rawRes.text() : null

    let decoded = null
    if (rawHex) {
      const { decodePushDropFromTx } = await import('@/lib/verify')
      decoded = decodePushDropFromTx(rawHex)
    }

    return { details, decoded }
  } catch {
    return { details: null, decoded: null }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const typestamp = await getTypeStamp(params.txid)
  const title = typestamp?.title || 'TypeStamp Certificate'
  const description = `Verified typestamp on BSV blockchain — TXID: ${params.txid.slice(0, 16)}...`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    title: `${title} — TypeStamp`,
    description,
    openGraph: {
      title: `${title} — TypeStamp`,
      description,
      url: `${appUrl}/c/${params.txid}`,
      siteName: 'TypeStamp',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${title} — TypeStamp`,
      description,
    },
  }
}

export default async function CertificatePage({ params }: Props) {
  const typestamp = await getTypeStamp(params.txid)
  const { details, decoded } = await getOnChainData(params.txid)

  // Use DB data if available, otherwise fall back to on-chain data
  const title = typestamp?.title || decoded?.title || 'Unknown TypeStamp'
  const content = typestamp?.content || undefined
  const identityKey = typestamp?.identityKey || decoded?.lockingPublicKey || 'Unknown'
  const displayName = typestamp?.displayName || undefined
  const showIdentityKey = typestamp?.showIdentityKey ?? true
  const timestamp = typestamp?.timestamp || (decoded?.timestamp ? parseInt(decoded.timestamp) : 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CertificateCard
        txid={params.txid}
        title={title}
        content={content}
        identityKey={identityKey}
        displayName={displayName}
        showIdentityKey={showIdentityKey}
        timestamp={timestamp}
        blockheight={details?.blockheight}
        blocktime={details?.blocktime}
        confirmations={details?.confirmations}
      />
      <TransactionHistory txid={params.txid} />
    </div>
  )
}
