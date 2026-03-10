# TypeStamp

Stake a timestamped, identity-bound claim on your ideas, works, IP, quotes, phrases, or any text by recording them on the BSV blockchain as PushDrop tokens.

**Core promise:** "This exact content was known to this identity at this block height."

## How It Works

1. **Write** your stamp — an idea, quote, phrase, or any text you want to timestamp immutably on the blockchain
2. **Choose visibility** — **Public** (text visible to everyone) or **Sealed** (only the SHA-256 hash is stored, content stays private)
3. **Stamp it** — TypeStamp hashes the content and records a PushDrop token on BSV
4. **Share** the certificate link — anyone can verify the stamp without a wallet
5. **Verify** — prove knowledge of sealed content by matching the original text against the on-chain hash at `/verify`
6. **Manage** — toggle public/private visibility or delete stamps from My Stamps

## Features

- **Public stamps** — text visible on the public registry and certificate page
- **Sealed stamps** — content hidden, only the hash is stored on-chain and in the database. Prove knowledge via the verify page.
- **Delete stamps** — owner can delete a stamp, freeing the text for others to claim
- **Duplicate detection** — identical text cannot be stamped twice
- **Identity-bound** — each stamp is locked to the creator's identity key
- **UTC timestamps** — all times displayed in UTC to match blockchain time
- **Overlay Network** — stamps are submitted to a BSV Overlay for decentralized indexing and lookup
- **Dark/light theme** — toggle between themes

## Tech Stack

- **Next.js 14** — App Router, TypeScript, Tailwind CSS
- **@bsv/sdk** — WalletClient, PushDrop, SecurityLevels
- **@bsv/overlay-express** — Overlay server with custom topic manager and lookup service
- **MongoDB Atlas** — stamp metadata, overlay indexing, duplicate detection
- **WhatsOnChain API** — on-chain transaction verification

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A BSV wallet (e.g. BSV Desktop) for creating stamps

### Setup

```bash
# Install dependencies
npm install
cd overlay && npm install && cd ..

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI
```

### Environment Variables

Create a `.env.local` file:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/typestamp?retryWrites=true&w=majority
NEXT_PUBLIC_WOC_BASE=https://api.whatsonchain.com/v1/bsv/main
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create an `overlay/.env` file:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/typestamp?retryWrites=true&w=majority
OVERLAY_PRIVATE_KEY=<hex private key>
OVERLAY_HOSTING_URL=http://localhost:8080
OVERLAY_PORT=8080
```

### Run

```bash
# Run Next.js + Overlay server together
npm run dev:all
```

This starts both the Next.js app on port 3000 and the overlay server on port 8080.

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx                    # Home — stamp form + public feed
  c/[txid]/page.tsx           # Certificate page (SSR + OG tags)
  overlaynetwork/page.tsx     # Overlay Network — live feed from overlay lookup
  verify/page.tsx             # Verify a stamp (no wallet needed)
  mytypestamps/page.tsx       # User's stamps + visibility toggle
  api/typestamps/             # POST (create, submits BEEF to overlay) + GET (list)
  api/typestamps/[txid]/      # GET (single) + PATCH (visibility) + DELETE
  api/overlay/check/          # GET (duplicate check via overlay lookup)
  api/overlay/stamps/         # GET (paginated stamps from overlay)

components/
  WalletProvider.tsx           # React context for wallet state
  Header.tsx                   # Nav bar + wallet connect + theme toggle
  StampForm.tsx                # Content input + public/sealed mode + stamp flow
  NetworkFeed.tsx              # Overlay Network feed with pagination
  PublicFeed.tsx               # Public registry table with pagination
  CertificateCard.tsx          # Certificate display + share + delete
  ShareButtons.tsx             # X + LinkedIn share
  VerifyForm.tsx               # Verify content against on-chain hash
  MyTypeStampsList.tsx         # User's stamps with search, hash copy, visibility
  ThemeToggle.tsx              # Dark/light mode toggle
  Footer.tsx                   # Site footer

lib/
  mongodb.ts                   # MongoDB connection singleton
  hash.ts                      # SHA-256 via Web Crypto API
  wallet.ts                    # WalletClient singleton + helpers
  attest.ts                    # PushDrop token creation
  verify.ts                    # WhatsOnChain fetch + PushDrop decode
  share.ts                     # Social share URL builders

models/
  typestamp.ts                 # TypeStamp interface + MongoDB collection helper

overlay/
  src/index.ts                 # Overlay server entry point (OverlayExpress)
  src/TypeStampTopicManager.ts # Admits PushDrop outputs with typestamp protocol
  src/TypeStampLookupService.ts# Indexes admitted outputs, handles lookup queries
  src/TypeStampStorage.ts      # MongoDB storage for overlay-indexed stamps
```

## On-Chain Format

Each stamp is a PushDrop token with four fields:

| Field | Value |
|-------|-------|
| Protocol | `typestamp` |
| Hash | `sha256:<hex>` |
| Title | First 100 chars of content (or `Sealed Stamp`) |
| Timestamp | Unix timestamp |

The token is locked to the creator's identity key, signed, and stored in the `typestamp` basket.

## Database Schema

| Field | On-Chain | MongoDB | Notes |
|-------|----------|---------|-------|
| `txid` | — | Yes | Unique transaction ID |
| `hash` | Yes | Yes | SHA-256 of content |
| `title` | Yes | Yes | First 100 chars or "Sealed Stamp" |
| `content` | No | Yes* | *Empty string for sealed stamps |
| `identityKey` | Yes (locking key) | Yes | Creator's public key |
| `timestamp` | Yes | Yes | Unix timestamp |
| `isPublic` | No | Yes | Visibility in public feed |
| `isSealed` | No | Yes | Whether content is hidden |
| `displayName` | No | Yes | Creator's chosen display name |
| `showIdentityKey` | No | Yes | Whether to show identity key publicly |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/typestamps` | Create a stamp + submit BEEF to overlay |
| `GET` | `/api/typestamps` | List stamps (by identity key or public) |
| `GET` | `/api/typestamps/[txid]` | Get a single stamp |
| `PATCH` | `/api/typestamps/[txid]` | Toggle visibility |
| `DELETE` | `/api/typestamps/[txid]` | Delete a stamp (owner only) |
| `GET` | `/api/overlay/check` | Check for duplicate hash via overlay |
| `GET` | `/api/overlay/stamps` | Paginated stamps from overlay lookup |

## Overlay Architecture

When a stamp is created, the raw transaction (BEEF) is submitted to the overlay server running on port 8080. The overlay:

1. **Topic Manager** (`tm_typestamp`) validates the PushDrop output matches the typestamp protocol
2. **Lookup Service** (`ls_typestamp`) indexes admitted outputs into MongoDB with decoded fields
3. **Lookup queries** support `findAll`, `findByHash`, and `findByIdentityKey`

The `/overlaynetwork` page displays stamps indexed by the overlay, independent of the app's own MongoDB records.

## Deploy

```bash
npm run build
```

Deploy to Vercel and set the same environment variables in your project settings. The overlay server needs to be hosted separately (e.g. on a VPS or cloud instance).
