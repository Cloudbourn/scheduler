const {
  ENVIRONMENT = 'dev',
  PROJECT,
} = process.env
const JOBS_TABLE = process.env.JOBS_TABLE || `${PROJECT}-jobs-${ENVIRONMENT}`

const dynamo = require('../utils/dynamoClient')

exports.getById = async (id) => {
  return dynamo
    .get({
      TableName: JOBS_TABLE,
      Key: {
        id,
      },
    })
    .then(({ Item }) => Item)
}

/**
 * Upsert. Overwrites entire items.
 * @param {*} job
 */
exports.put = async (job) => {
  job.updatedAt = new Date().toJSON()

  return dynamo.put({
    TableName: JOBS_TABLE,
    Item: job,
  })
}

/**
 * Modifies the item with the supplied keys but leaves others untouched
 * @param {*} job
 * @returns The complete updated job
 */
exports.update = async (job) => {
  job.updatedAt = new Date().toJSON()

  return dynamo.update({
    TableName: JOBS_TABLE,
    Key: { id: job.id },
    Item: job,
    ReturnValues: 'ALL_NEW',
  })
}

exports.list = async () => {
  const jobs = await dynamo
    .scanAll({ TableName: JOBS_TABLE })
  return jobs
    // FIFO (show soonest first)
    .sort(({ scheduleAt: a }, { scheduleAt: b }) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
    // Strip ttlUnixSeconds since its an internal field
    .map(this.formatForApi)
}

/**
 * Removes properties that expose unnecessary internals
 */
exports.formatForApi = ({ ttlUnixSeconds, ...job }) => {
  return job
}
