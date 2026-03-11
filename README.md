# Typestamp

Stake a timestamped, identity-bound claim on your ideas, works, IP, quotes, phrases, or any text by recording them on the BSV blockchain as PushDrop tokens.

**Core promise:** "This exact content was known to this identity at this block height."

## How It Works

1. **Write** your stamp — an idea, quote, phrase, or any text you want to timestamp immutably on the blockchain
2. **Choose visibility** — **Public** (text visible to everyone) or **Sealed** (only the SHA-256 hash is stored, content stays private)
3. **Stamp it** — Typestamp hashes the content and records a PushDrop token on BSV
4. **Share** the certificate link — anyone can verify the stamp without a wallet
5. **Verify** — prove knowledge of sealed content by matching the original text against the on-chain hash at `/verify`
6. **Manage** — toggle public/private visibility or delete stamps from My Stamps

## Features

- **Public stamps** — text visible on the overlay network table and certificate page
- **Sealed stamps** — content hidden, only the hash is stored on-chain and in the database. Prove knowledge via the verify page.
- **Overlay Network page** — live feed of all stamps indexed by independent overlay nodes, with auto-refresh every 30 seconds
- **Overlay node discovery** — nodes advertise via SHIP protocol and are discovered automatically; the app health-checks and displays all active nodes
- **Certificate page** — shareable, server-rendered page with OG tags for any stamp
- **Verify page** — paste any text to check if it matches a stamp on-chain, with public/sealed explainer cards and match/no-match result states
- **Duplicate detection** — identical text cannot be stamped twice (checked against both overlay and app DB)
- **Identity-bound** — each stamp is locked to the creator's identity key via BRC-42 key derivation
- **Block height caching** — block heights fetched from WhatsOnChain and cached in MongoDB
- **Delete stamps** — owner can delete a stamp, freeing the text for others to claim
- **Dark/light theme** — toggle between themes
- **Home page teaser** — 3 most recent stamps with relative time, linking to the full overlay table

## Tech Stack

- **Next.js 15** — App Router, React 19, TypeScript, Tailwind CSS
- **@bsv/sdk** — WalletClient, PushDrop, BRC-42 key derivation
- **@bsv/overlay-express** — Overlay server with custom topic manager and lookup service
- **MongoDB Atlas** — stamp metadata, overlay indexing, duplicate detection
- **WhatsOnChain API** — on-chain transaction verification, block height lookups, UTXO fetching

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A BSV wallet extension (e.g. Yours Wallet) for creating stamps

### Install

```bash
npm install
cd overlay && npm install && cd ..
```

### Environment Variables

Create a `.env.local` file in the project root:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/typestamp?retryWrites=true&w=majority
NEXT_PUBLIC_WOC_BASE=https://api.whatsonchain.com/v1/bsv/main
NEXT_PUBLIC_APP_URL=http://localhost:3000
OVERLAY_URL=http://localhost:8080
OVERLAY_KNOWN_NODES=              # comma-separated fallback overlay URLs (optional, used if SHIP discovery returns empty)
```

Create an `overlay/.env` file:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/typestamp?retryWrites=true&w=majority
OVERLAY_PRIVATE_KEY=<64-char hex private key>
OVERLAY_HOSTING_URL=http://localhost:8080
OVERLAY_PORT=8080
OVERLAY_PEER_URLS=                # comma-separated peer node URLs for GASP sync + cross-submission (optional)
KNEX_URL=                         # external DB for engine state, e.g. mysql://user:pass@host:port/db (optional, defaults to SQLite)
```

### Run

```bash
# Run Next.js + Overlay server together
npm run dev:all
```

This starts the Next.js app on port 3000 and the overlay server on port 8080 via `concurrently`.

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx                    # Home — stamp form + recent stamps teaser
  c/[txid]/page.tsx           # Certificate page (SSR + OG tags)
  overlaynetwork/page.tsx     # Overlay Network — live feed from overlay nodes
  verify/page.tsx             # Verify a stamp (no wallet needed)
  mytypestamps/page.tsx       # User's stamps + visibility toggle
  api/typestamps/             # POST (create + submit BEEF to overlay) + GET (list)
  api/typestamps/[txid]/      # GET (single) + PATCH (visibility) + DELETE
  api/typestamps/check/       # GET (duplicate check)
  api/overlay/check/          # GET (duplicate check via overlay)
  api/overlay/stamps/         # GET (paginated stamps from overlay, author join, block heights)

components/
  WalletProvider.tsx           # React context for wallet state
  Header.tsx                   # Nav bar + wallet connect + theme toggle
  StampForm.tsx                # Content input + public/sealed mode + stamp flow
  RecentStampsTeaser.tsx       # Home page — 3 most recent stamps with relative time
  NetworkFeed.tsx              # Overlay Network feed with auto-refresh + pagination
  CertificateCard.tsx          # Certificate display + share + delete
  ShareButtons.tsx             # X + LinkedIn share
  VerifyForm.tsx               # Verify content against on-chain hash
  MyTypeStampsList.tsx         # User's stamps with search, hash copy, visibility toggle
  ThemeToggle.tsx              # Dark/light mode toggle
  Footer.tsx                   # Site footer

  overlay/
    OverlayStampTable.tsx      # 6-column table (Typestamp, Author, Identity Key, TXID, Block, Created At)
    OverlayStats.tsx           # Active nodes, stamps indexed, current block cards
    OverlayHero.tsx            # Overlay page header with live connection indicator
    OverlayEducation.tsx       # Animated flow diagram: BSV Blockchain → Overlay Node → App
    OverlayNodePanel.tsx       # Connected overlay nodes with health status
    OverlayTrustBanner.tsx     # Trust/immutability banner
    OverlayPagination.tsx      # Pagination controls
    types.ts                   # OverlayStamp interface

lib/
  mongodb.ts                   # MongoDB connection singleton
  hash.ts                      # SHA-256 via Web Crypto API
  wallet.ts                    # WalletClient singleton + helpers
  attest.ts                    # PushDrop token creation
  verify.ts                    # WhatsOnChain fetch + PushDrop decode
  share.ts                     # Social share URL builders
  overlay-discovery.ts         # SHIP-based overlay node discovery + health checks

overlay/
  src/index.ts                 # Overlay server entry (OverlayExpress + DirectAdvertiser)
  src/DirectAdvertiser.ts      # Custom SHIP/SLAP advertiser (bypasses Dojo, spends P2PKH directly)
  src/TypeStampTopicManager.ts # Validates PushDrop outputs with typestamp protocol
  src/TypeStampLookupService.ts# Indexes admitted outputs into MongoDB
  src/TypeStampStorage.ts      # MongoDB storage with upsert + indexes
  Dockerfile                   # Container build for overlay server
```

## On-Chain Format

Each stamp is a PushDrop token with four fields:

| Field | Value |
|-------|-------|
| Protocol | `typestamp` |
| Hash | `sha256:<hex>` |
| Title | First 100 chars of content (or `Sealed Stamp`) |
| Timestamp | Unix timestamp |

The token is locked to a derived key (BRC-42, protocol `[0, 'typestamp']`), signed, and stored in the `typestamp` basket.

## Overlay Architecture

The overlay network provides decentralized indexing — anyone can run a node and see the same data independently.

When a stamp is created, the raw transaction (BEEF) is submitted to all discovered overlay nodes. Each overlay node:

1. **Topic Manager** (`tm_typestamp`) validates the PushDrop output matches the typestamp protocol
2. **Lookup Service** (`ls_typestamp`) indexes admitted outputs into MongoDB with decoded fields (hash, title, timestamp, identity key)
3. **Lookup queries** support `findAll`, `findByHash`, and `findByIdentityKey`

### Node Discovery

Overlay nodes advertise themselves via the **SHIP** protocol. The app queries the bootstrap node's `ls_ship` service for advertisements with `tm_typestamp` topic, decodes the PushDrop outputs to extract domain URLs, and health-checks each one. Results are cached for 30 seconds.

A fallback `OVERLAY_KNOWN_NODES` environment variable (comma-separated URLs) ensures nodes are discoverable even before SHIP advertisements propagate.

### DirectAdvertiser

The default `OverlayExpress` advertiser (`LegacyNinjaAdvertiser`) connects to a Dojo wallet backend that can't see P2PKH UTXOs. Typestamp uses a custom `DirectAdvertiser` that bypasses Dojo entirely:

1. Derives the identity key from the overlay's private key
2. Fetches confirmed P2PKH UTXOs from WhatsOnChain for the identity address
3. Builds PushDrop advertisement outputs (SHIP for topic managers, SLAP for lookup services) using BRC-42 key derivation
4. Signs and broadcasts the transaction via WhatsOnChain
5. Cross-submits the tagged BEEF to peer overlay nodes (configured via `OVERLAY_PEER_URLS`) with the required `X-Topics` header

Advertisements are created on each startup once UTXOs are confirmed. The default SDK broadcaster (`TopicBroadcaster`) is replaced with a no-op to prevent OOM from broadcasting to every SHIP-discovered peer on the global network.

### GASP Sync

Overlay nodes synchronize their `tm_typestamp` data with each other using the **GASP** (Graph-Aware Sync Protocol). The sync approach works around several `OverlayExpress` limitations:

1. **GASP is disabled in config** (`configureEnableGASPSync(false)`) to prevent `start()` from blocking the HTTP listener while syncing
2. **GASP routes are registered manually** (`/requestSyncResponse` and `/requestForeignGASPNode`) with explicit `express.json()` middleware, because `start()` adds `bodyParser` after route registration
3. **The default advertiser and broadcaster are removed** before `start()` to prevent the `LegacyNinjaAdvertiser` and `TopicBroadcaster` from pulling massive data from the global overlay network
4. **Background sync**: after the HTTP listener is up, a `setImmediate` callback creates advertisements via `DirectAdvertiser`, submits them to the local engine, then runs `engine.startGASPSync()` scoped to `tm_typestamp` only

On each restart, nodes pull new UTXOs from their configured peers. The sync is unidirectional per restart — Node A pulls from Node B, and Node B pulls from Node A when it restarts. The engine stores full BEEF data for each output so that GASP can serve raw transactions and merkle proofs to requesting peers.

**Sync configuration** in `overlay/.env`:

```
OVERLAY_PEER_URLS=https://other-node.example.com   # comma-separated peer URLs
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/typestamps` | Create a stamp + submit BEEF to overlay nodes |
| `GET` | `/api/typestamps` | List stamps (by identity key or public, paginated) |
| `GET` | `/api/typestamps/[txid]` | Get a single stamp |
| `PATCH` | `/api/typestamps/[txid]` | Toggle visibility or hide stamp (owner only) |
| `DELETE` | `/api/typestamps/[txid]` | Delete a stamp (owner only) |
| `GET` | `/api/typestamps/check` | Check for duplicate hash |
| `GET` | `/api/overlay/check` | Check overlay + app collection for duplicate |
| `GET` | `/api/overlay/stamps` | Paginated stamps from overlay (joins author, caches block heights, discovers nodes) |

## Database

### MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `typestamps` | App-level stamp records (content, visibility, display name) |
| `overlay_typestamps` | Overlay-indexed stamps (decoded from on-chain PushDrop tokens) |

The overlay server also uses SQLite (or MySQL/PostgreSQL via `KNEX_URL`) for internal overlay engine state (SHIP/SLAP records, UTXO tracking).

## Deploy

### Next.js App (Vercel)

```bash
npm run build
```

Deploy to Vercel and set environment variables (`MONGODB_URI`, `NEXT_PUBLIC_WOC_BASE`, `NEXT_PUBLIC_APP_URL`, `OVERLAY_URL`).

### Overlay Server (Railway / VPS)

Deploy from the `overlay/` directory:

```bash
cd overlay
railway up
```

Or use the Dockerfile directly. Each overlay node needs its own `OVERLAY_PRIVATE_KEY`, `OVERLAY_HOSTING_URL`, and `MONGODB_URI`. Set `OVERLAY_PEER_URLS` to point to other nodes for cross-discovery and GASP sync.

**Important:** For GASP sync to work across deploys, use an external database for the overlay engine's internal storage by setting `KNEX_URL` (e.g. `mysql://...`). Without it, the engine defaults to SQLite which is ephemeral on container platforms like Railway, meaning BEEF data is lost on each deploy and GASP can't serve historical outputs to peers.
