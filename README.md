# Typestamp

Typestamp is a BSV demo for recording a SHA-256 commitment to text, sharing a certificate page and checking text against the recorded hash. It combines a Next.js application with a separate overlay node that indexes PushDrop outputs.

The demo shows content commitments and transaction lookup. A hash match is not proof of authorship, ownership of an idea or the accuracy of the text. The displayed creation timestamp is supplied by the client; blockchain inclusion information is retrieved separately from WhatsOnChain.

## What it does

- Creates a 1-satoshi PushDrop output through a compatible BRC-100 wallet.
- Offers public and sealed stamp modes.
- Displays certificate pages at `/c/[txid]` and a text-matching page at `/verify`.
- Lists application records in **My Stamps** and indexed transactions in the overlay feed.
- Discovers overlay nodes through SHIP, with configured fallback nodes.
- Supports application-level visibility changes, hiding and deletion.

## What is stored

| Location | Data |
| --- | --- |
| BSV output | Protocol marker `typestamp`, `sha256:<hash>`, title of up to 100 characters and client timestamp, with the PushDrop locking structure. |
| MongoDB `typestamps` | Application metadata, identity-key string, visibility and public text. Sealed records store an empty content string and the title `Sealed Stamp`. |
| MongoDB `overlay_typestamps` | Fields decoded from outputs admitted by the overlay. |
| Overlay engine database | Transaction and indexing state, using SQLite by default or the configured SQL database. |

Public text is stored in the application's database; only its hash and title are embedded by the stamp-creation helper. The wallet derives the output's locking key using protocol `[0, 'typestamp']`, a timestamp-based key ID and the `self` counterparty.

Deleting an application record does not erase the transaction or remove copies held by overlays. Duplicate checks are application/overlay lookups, not a global blockchain uniqueness guarantee.

## Requirements

- Node.js 22 and npm.
- MongoDB, available to both the application and overlay.
- A funded BRC-100 wallet for creating stamps.
- A separate private key and funds for the overlay's advertising transactions.
- Native build prerequisites if the SQLite dependency cannot use a prebuilt binary.

The overlay's chain tracker and advertiser target BSV mainnet. Keep the client wallet and explorer configuration consistent with that network.

## Local setup

```sh
git clone https://github.com/bsv-blockchain-demos/type-stamp.git
cd type-stamp
npm ci
npm ci --prefix overlay
```

Create `.env.local` at the repository root:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/typestamp
NEXT_PUBLIC_WOC_BASE=https://api.whatsonchain.com/v1/bsv/main
NEXT_PUBLIC_APP_URL=http://localhost:3000
OVERLAY_URL=http://localhost:8080
```

Create `overlay/.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/typestamp
OVERLAY_PRIVATE_KEY=<your-hex-private-key>
OVERLAY_HOSTING_URL=http://localhost:8080
OVERLAY_PORT=8080
```

The application and custom overlay storage explicitly select the MongoDB database named `typestamp`, rather than deriving that name from the URI path.

Optional configuration:

| Variable | Package | Purpose |
| --- | --- | --- |
| `OVERLAY_KNOWN_NODES` | Application | Comma-separated fallback overlay URLs. |
| `OVERLAY_PEER_URLS` | Overlay | Peer nodes for advertisement submission and synchronisation. |
| `KNEX_URL` | Overlay | External engine database; a `mysql` URL selects MySQL, other configured URLs select PostgreSQL. |

When `KNEX_URL` is absent, the overlay uses `overlay/data/overlay.db` when started through the provided scripts. Keep that directory persistent if relying on SQLite.

```sh
npm run dev:all
```

This starts Next.js on port 3000 and the overlay on port 8080. `npm run dev` and `npm run dev:overlay` can also be run in separate terminals.

Overlay startup attempts to create SHIP/SLAP advertisements using confirmed mainnet UTXOs belonging to its private key. Starting a funded node can therefore submit transactions. It then runs background GASP synchronisation with configured peers.

## Using the demo

1. Open `http://localhost:3000` and connect the wallet.
2. Enter text and choose public or sealed mode.
3. Approve the wallet transaction and save the certificate URL.
4. Use `/verify` to compare text with the transaction's recorded hash.
5. Inspect **My Stamps** for application records or the overlay feed for indexed outputs.

Sealed mode omits the full text from the stored application record. Keep your original text if you want to demonstrate a hash match later. Hashes of short or predictable text can still be guessed.

## API and implementation limits

| Route | Purpose |
| --- | --- |
| `GET`, `POST /api/typestamps` | List application records or register a stamp and attempt overlay submission. |
| `GET /api/typestamps/[txid]` | Retrieve an application record. |
| `PATCH`, `DELETE /api/typestamps/[txid]` | Change application visibility or remove a record. |
| `/api/typestamps/check` | Application duplicate lookup. |
| `/api/overlay/check` | Duplicate lookup using overlay/application data. |
| `/api/overlay/stamps` | Overlay feed and discovery information. |

Creation accepts client-supplied metadata without independently binding the identity to the transaction. Mutation routes compare a supplied identity-key string with the stored value; they do not authenticate possession of that key. Private-record content access also uses a hash match, and that hash is public in the transaction. These checks need development before the API can provide authenticated ownership or confidential access.

Overlay submission is asynchronous and its failure is suppressed by the creation endpoint. A saved application record is therefore not proof that a node indexed the transaction or that it was mined. Verification currently uses explorer responses rather than independently checking a Merkle proof.

## Builds and checks

```sh
npm run build
npm start
```

The Next.js build requires `MONGODB_URI` and initialises the database module while collecting page data. Supply an appropriate build-time database configuration as well as runtime settings.

The root package defines `npm run lint` but no automated test script. The overlay runs through `tsx` and has no build or test script. Its TypeScript check can be invoked from `overlay/` with `npx tsc --noEmit`; it currently reports missing Express declarations and incompatible SDK types in the lookup service.

## Source and deployment

- [lib/attest.ts](lib/attest.ts): wallet transaction and PushDrop fields.
- [lib/verify.ts](lib/verify.ts): explorer requests and output decoding.
- [app/api/](app/api/): application endpoints.
- [overlay/src/](overlay/src/): topic manager, lookup service, storage and direct advertiser.
- [overlay/Dockerfile](overlay/Dockerfile): overlay container.

Deploy the application and overlay separately. Set the application's public URL and explorer base at build time, supply server-side MongoDB settings, and give each overlay its own private key and hosting URL. Persist the engine database as well as MongoDB so historical BEEF remains available for synchronisation.

## Licence

**Open BSV Licence v6.** See [LICENSE.txt](LICENSE.txt) for the full terms. The licence applies to this project's original code and documentation and restricts use to the BSV blockchain defined in the licence. Third-party code, assets and referenced standards retain their respective terms.
