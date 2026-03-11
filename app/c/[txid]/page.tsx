import { Metadata } from 'next'
import CertificateCard from '@/components/CertificateCard'

interface Props {
  params: Promise<{ txid: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { txid } = await props.params
  const typestamp = await getTypeStamp(txid)
  const title = typestamp?.title || 'Typestamp Certificate'
  const description = `Verified typestamp on BSV blockchain — TXID: ${txid.slice(0, 16)}...`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    title: `${title} — Typestamp`,
    description,
    openGraph: {
      title: `${title} — Typestamp`,
      description,
      url: `${appUrl}/c/${txid}`,
      siteName: 'Typestamp',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${title} — Typestamp`,
      description,
    },
  }
}

export default async function CertificatePage(props: Props) {
  const { txid } = await props.params
  const searchParams = await props.searchParams
  const typestamp = await getTypeStamp(txid)
  const { details, decoded } = await getOnChainData(txid)

  // Use DB data first, then on-chain data, then query params (for freshly created stamps)
  const qp = searchParams
  const title = typestamp?.title || decoded?.title || (qp.title as string) || 'Unknown Typestamp'
  const content = typestamp?.content || (qp.content as string) || undefined
  const identityKey = typestamp?.identityKey || decoded?.lockingPublicKey || (qp.identityKey as string) || 'Unknown'
  const displayName = typestamp?.displayName || (qp.displayName as string) || undefined
  const showIdentityKey = typestamp?.showIdentityKey ?? true
  const isSealed = typestamp?.isSealed === true || qp.isSealed === '1'
  const timestamp = typestamp?.timestamp || (decoded?.timestamp ? parseInt(decoded.timestamp) : 0) || (qp.timestamp ? parseInt(qp.timestamp as string) : 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CertificateCard
        txid={txid}
        title={title}
        content={content}
        identityKey={identityKey}
        displayName={displayName}
        showIdentityKey={showIdentityKey}
        isSealed={isSealed}
        timestamp={timestamp}
        blockheight={details?.blockheight}
        blocktime={details?.blocktime}
        confirmations={details?.confirmations}
      />
    </div>
  )
}
