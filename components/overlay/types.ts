export interface OverlayStamp {
  txid: string
  outputIndex: number
  hash: string
  title: string
  timestamp: number
  identityKey: string
  isSealed: boolean
  displayName?: string
  blockHeight?: number
}
