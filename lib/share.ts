export function buildXShareUrl(txid: string, title: string, appUrl: string): string {
  const url = `${appUrl}/c/${txid}`
  const text = `🔏 I just created a typestamp on the BSV blockchain!\n\n"${title.slice(0, 80)}"\n\nVerify it: ${url}\n\n#TypeStamp #BSV #Blockchain`
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
}

export function buildLinkedInShareUrl(txid: string, appUrl: string): string {
  const url = `${appUrl}/c/${txid}`
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}
