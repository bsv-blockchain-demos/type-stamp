import { TopicManager, AdmittanceInstructions } from '@bsv/overlay'
import { Transaction, PushDrop } from '@bsv/sdk'

export class TypeStampTopicManager implements TopicManager {
  async identifyAdmissibleOutputs(
    beef: number[],
    previousCoins: number[]
  ): Promise<AdmittanceInstructions> {
    const outputsToAdmit: number[] = []

    try {
      const tx = Transaction.fromBEEF(beef)

      for (let i = 0; i < tx.outputs.length; i++) {
        try {
          const output = tx.outputs[i]
          if (!output.lockingScript) continue

          const decoded = PushDrop.decode(output.lockingScript)
          if (!decoded || !decoded.fields || decoded.fields.length < 4) continue

          const protocol = new TextDecoder().decode(new Uint8Array(decoded.fields[0]))
          const hashField = new TextDecoder().decode(new Uint8Array(decoded.fields[1]))

          if (protocol === 'typestamp' && hashField.startsWith('sha256:') && hashField.length === 71) {
            outputsToAdmit.push(i)
          }
        } catch {
          // Skip outputs that fail to decode
          continue
        }
      }
    } catch (err) {
      console.error('TypeStampTopicManager: Failed to parse BEEF:', err)
    }

    return {
      outputsToAdmit,
      coinsToRetain: [],
    }
  }

  async getDocumentation(): Promise<string> {
    return `# TypeStamp Topic Manager

Manages admittance of TypeStamp PushDrop tokens on the BSV blockchain.

## Protocol
Each TypeStamp output contains a PushDrop token with fields:
- field[0]: "typestamp" (protocol identifier)
- field[1]: "sha256:<64-char-hex>" (content hash, 71 chars total)
- field[2]: title (up to 100 chars)
- field[3]: unix timestamp

Stamps are immutable — once created, they are never spent.`
  }

  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'TypeStamp Topic Manager',
      shortDescription: 'Indexes TypeStamp PushDrop tokens for on-chain text attestation',
      version: '0.1.0',
    }
  }
}
