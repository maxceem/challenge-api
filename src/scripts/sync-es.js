/**
 * Migrate Data from Dynamo DB to ES
 *
 * How to use:
 * - To re-index ALL the challenges:
 *   `npm run sync-es`
 * - To re-index challenges by ids:
 *   `npm run sync-es -- challenge-id-01 challenge-id-02  challenge-id-03`
 */

const config = require('config')
const logger = require('../common/logger')
const helper = require('../common/helper')

const esClient = helper.getESClient()

/**
 * Migrate records from DB to ES
 *
 * @param {Array<string>} list of challenge ids
 */
async function migrateRecords (challengeIds) {
  let challenges = []

  if (challengeIds.length > 0) {
    challenges = await helper.getByIds('Challenge', challengeIds)
  } else {
    challenges = await helper.scan('Challenge')
  }

  logger.debug(`Found ${challenges.length} challenges to re-index.`)
  for (const challenge of challenges) {
    logger.debug(`Indexing challenge "${challenge.id}"`)
    await esClient.update({
      index: config.get('ES.ES_INDEX'),
      type: config.get('ES.ES_TYPE'),
      refresh: config.get('ES.ES_REFRESH'),
      id: challenge.id,
      body: { doc: challenge, doc_as_upsert: true }
    })
  }
}

const challengeIds = process.argv.slice(2)

migrateRecords(challengeIds)
  .then(() => {
    logger.info('Done')
    process.exit()
  })
  .catch((err) => {
    logger.logFullError(err)
    process.exit(1)
  })
