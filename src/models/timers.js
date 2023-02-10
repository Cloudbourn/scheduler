const epochtime = require('../utils/epochtime')
const jobs = require('./jobs')
const phin = require('phin')
const sqs = require('../utils/sqs')
const sleep = require('../utils/sleep')
const { preConnectSocket } = require('../utils/preconnect')

// Adding a small margin to skip the roundtrip to SQS
// if the job is meant to be executed almost immediately anyway.
const EXECUTION_MARGIN_IN_SECONDS = 2

exports.scheduleOrRun = async (job) => {
  const now = epochtime.fromDate(new Date())
  const scheduled = epochtime.fromDate(job.scheduleAt)

  console.log({ job, now, scheduled })

  if (now + EXECUTION_MARGIN_IN_SECONDS >= scheduled) {
    const [socket] = await Promise.all([
      preConnectSocket(job.endpoint),
      sleep((scheduled - now) * 1000),
    ])
    return this.execute(job, socket)
  }

  if (scheduled - now <= 48 * 60 * 60) {
    // Lets use SQS for shortterm storage.
    // Skip writing to dynamo if job status is already in the sqs stage
    const isBouncing = job.status === 'QUEUED'
    job.status = 'QUEUED'
    await sqs.sendDelayedMessage(JSON.stringify(job), Math.min(scheduled - now, 15 * 60))
    if (isBouncing) return job
  } else {
    // Route to longterm storage in DynamoDB
    job.ttlUnixSeconds = epochtime.fromDate(job.scheduleAt)
    job.status = 'STORED'
  }

  await jobs.put(job)
  return job
}

exports.execute = async (job, createConnection = undefined) => {
  job.status = 'RUNNING'
  await jobs.put(job)

  // TODO: this should use SQS to decouple HTTP errors from incoming event batches
  const response = await phin({
    url: job.endpoint,
    method: job.method,
    headers: {
      'User-Agent': 'github:Cloudbourn/scheduler',
      'X-Job-Id': job.id,
      // TODO: content-length and content-type?
      // TODO: job.headers?
    },
    data: job.body,
    followRedirects: true,
    timeout: 500,
    createConnection,
  })

  if (response.statusCode > 399) {
    console.error('Endpoint returned 4xx or 5xx!', { job })
  }

  job.executedAt = new Date().toJSON()
  job.status = 'DONE'
  await jobs.put(job)
  return job
}
