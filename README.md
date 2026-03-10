# ClaimStamp

Stake a timestamped, identity-bound claim on your ideas, works, IP, quotes, phrase or any text by recording them on the BSV blockchain as tokens. 

**Core promise:** "This exact content was known to this identity at this block height."

## How It Works

1. **Write** your claim — an idea, quote, phrase, or any text you want to tokenize and timestamp immutably on the blockchain
2. **Stamp** it — ClaimStamp hashes the content and records a PushDrop token on the BSV blockchain
3. **Share** the certificate link — anyone can verify the claim without a wallet
4. **Toggle** your claim can be seen available on the public feed, or toggled to private as you see fit

## Tech Stack

- **Next.js 14** — App Router, TypeScript, Tailwind CSS
- **@bsv/sdk** — WalletClient, PushDrop, SecurityLevels
- **MongoDB Atlas** — claim metadata, duplicate detection, public feed
- **WhatsOnChain API** — on-chain verification

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A BSV wallet (e.g. BSV Desktop) for stamping claims

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI
```

### Environment Variables

Create a `.env.local` file:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/claimstamp?retryWrites=true&w=majority
NEXT_PUBLIC_WOC_BASE=https://api.whatsonchain.com/v1/bsv/main
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx                    # Home — stamp form + public feed
  c/[txid]/page.tsx           # Certificate page (SSR + OG tags)
  verify/page.tsx             # Verify a claim (no wallet needed)
  myclaimstamps/page.tsx      # User's claims + visibility toggle
  api/claims/                 # POST (create) + GET (list)
  api/claims/[txid]/          # GET (single) + PATCH (toggle visibility)
  api/claims/check/           # GET (duplicate hash check)

components/
  WalletProvider.tsx           # React context for wallet state
  Header.tsx                   # Nav bar + wallet connect button
  StampForm.tsx                # Content input + stamp flow
  PublicFeed.tsx               # Recent public claims feed
  CertificateCard.tsx          # Certificate display + share buttons
  ShareButtons.tsx             # X + LinkedIn share
  VerifyForm.tsx               # Verify content against on-chain hash
  MyClaimsList.tsx             # User's claims + public/private toggle

lib/
  mongodb.ts                   # MongoDB connection singleton
  hash.ts                      # SHA-256 via Web Crypto API
  wallet.ts                    # WalletClient singleton + helpers
  attest.ts                    # PushDrop token creation
  verify.ts                    # WhatsOnChain fetch + PushDrop decode
  share.ts                     # Social share URL builders

models/
  claim.ts                     # Claim type + MongoDB collection helper
```

## On-Chain Format

Each ClaimStamp is a PushDrop token with four fields:

| Field | Value |
|-------|-------|
| Protocol | `claimstamp` |
| Hash | `sha256:<hex>` |
| Title | First 100 characters of content |
| Timestamp | Unix timestamp |

The token is locked to the creator's identity key, signed, and stored in the `claimstamp` basket.

## Deploy

Deploy to Vercel:

```bash
npm run build
```

Set the same environment variables in your Vercel project settings.
