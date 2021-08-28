
const {
  ENVIRONMENT = 'dev',
  PROJECT,
} = process.env

const dynamo = require('../utils/dynamoClient')
const epochtime = require('../utils/epochtime')

const JOBS_TABLE = process.env.JOBS_TABLE || `${PROJECT}-jobs-${ENVIRONMENT}`

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
  job.ttlUnixSeconds = epochtime.fromDate(job.executeAt)

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
  if (job.executeAt) job.ttlUnixSeconds = epochtime.fromDate(job.executeAt)

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
    .sort((a, b) => {
      return a.scheduledAt - b.scheduledAt
    })
    // Strip ttlUnixSeconds since its an internal field
    .map(job => {
      const { ttlUnixSeconds, ...rest } = job
      return rest
    })
}

exports.execute = async (job) => {}
