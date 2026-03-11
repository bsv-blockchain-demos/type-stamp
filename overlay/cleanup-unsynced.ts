/**
 * Cleanup script: removes the 5 stamps from Node 1 that are missing BEEF data
 * and can't be synced via GASP. After running, both nodes will have 2 stamps in sync.
 *
 * Usage: MONGODB_URI=... KNEX_URL=... npx tsx cleanup-unsynced.ts
 *
 * Run this against Node 1's databases only.
 */
import { MongoClient } from 'mongodb'
import Knex from 'knex'

// The 5 txids that failed GASP sync (No matching output found / missing BEEF)
const BAD_TXIDS = [
  '4d39bc2fdc5aad8d9671580b6b02031ab860406c4d31132ae8a710731069e7de',
  '0f2f1f9d62b29e13f56366d273119029a44a3870c8e49e7bed6549b1482f2d22',
  'f3a51e83322a2016719f8a914fbfd1437bf4486db2a7800339b553da5bac0f81',
  '910af5ff8ed00f1588b2f9f8b7a2ff7c91ef679ccdbea7811b06557a355cdf52',
  '55595bcfe2b14c8990cd60f84db2950ba7b019284954285f2b64a8fceb6ff989',
]

async function main() {
  const mongoUri = process.env.MONGODB_URI
  const knexUrl = process.env.KNEX_URL

  // --- MongoDB cleanup ---
  if (!mongoUri) {
    console.log('No MONGODB_URI — skipping MongoDB cleanup')
  } else {
    console.log('Connecting to MongoDB...')
  const mongo = new MongoClient(mongoUri)
  await mongo.connect()
  const db = mongo.db('typestamp')
  const col = db.collection('overlay_typestamps')

  const mongoBefore = await col.countDocuments()
  const mongoResult = await col.deleteMany({ txid: { $in: BAD_TXIDS } })
  const mongoAfter = await col.countDocuments()
    console.log(`MongoDB overlay_typestamps: deleted ${mongoResult.deletedCount} docs (${mongoBefore} → ${mongoAfter})`)
    await mongo.close()
  }

  // --- Knex cleanup ---
  if (knexUrl) {
    console.log('Connecting to Knex database...')
    const knex = Knex({
      client: knexUrl.startsWith('mysql') ? 'mysql2' : 'pg',
      connection: knexUrl,
    })

    const outBefore = await knex('outputs').count('* as cnt').first()
    const delOutputs = await knex('outputs').whereIn('txid', BAD_TXIDS).del()
    const delTx = await knex('transactions').whereIn('txid', BAD_TXIDS).del()
    const delApplied = await knex('applied_transactions').whereIn('txid', BAD_TXIDS).del()
    const outAfter = await knex('outputs').count('* as cnt').first()

    console.log(`Knex outputs: deleted ${delOutputs} rows (${outBefore?.cnt} → ${outAfter?.cnt})`)
    console.log(`Knex transactions: deleted ${delTx} rows`)
    console.log(`Knex applied_transactions: deleted ${delApplied} rows`)

    await knex.destroy()
  } else {
    console.log('No KNEX_URL set — skipping Knex cleanup (SQLite is ephemeral anyway)')
  }

  console.log('Done! Restart both overlay nodes to re-sync.')
}

main().catch(err => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
