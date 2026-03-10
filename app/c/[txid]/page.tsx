import { Metadata } from 'next'
import CertificateCard from '@/components/CertificateCard'

interface Props {
  params: { txid: string }
}

async function getClaim(txid: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${appUrl}/api/claims/${txid}`, {
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
  const claim = await getClaim(params.txid)
  const title = claim?.title || 'ClaimStamp Certificate'
  const description = `Verified claim on BSV blockchain — TXID: ${params.txid.slice(0, 16)}...`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    title: `${title} — ClaimStamp`,
    description,
    openGraph: {
      title: `${title} — ClaimStamp`,
      description,
      url: `${appUrl}/c/${params.txid}`,
      siteName: 'ClaimStamp',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${title} — ClaimStamp`,
      description,
    },
  }
}

export default async function CertificatePage({ params }: Props) {
  const claim = await getClaim(params.txid)
  const { details, decoded } = await getOnChainData(params.txid)

  // Use DB data if available, otherwise fall back to on-chain data
  const title = claim?.title || decoded?.title || 'Unknown Claim'
  const content = claim?.content || undefined
  const identityKey = claim?.identityKey || decoded?.lockingPublicKey || 'Unknown'
  const timestamp = claim?.timestamp || (decoded?.timestamp ? parseInt(decoded.timestamp) : 0)

  return (
    <div className="max-w-2xl mx-auto">
      <CertificateCard
        txid={params.txid}
        title={title}
        content={content}
        identityKey={identityKey}
        timestamp={timestamp}
        blockheight={details?.blockheight}
        blocktime={details?.blocktime}
        confirmations={details?.confirmations}
      />
    </div>
  )
}
