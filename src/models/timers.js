const epochtime = require('../utils/epochtime')
const jobs = require('./jobs')
const phin = require('phin')
const sqs = require('../utils/sqs')
const eventbridge = require('../utils/eventbridge')

// Adding a small margin to skip the roundtrip to SQS
// if the job is meant to be executed almost immediately anyway.
const EXECUTION_MARGIN_IN_SECONDS = 2

exports.scheduleOrRun = async (job) => {
  const now = epochtime.fromDate(new Date())
  const scheduled = epochtime.fromDate(job.scheduleAt)

  console.log({ job, now, scheduled })

  if (now + EXECUTION_MARGIN_IN_SECONDS >= scheduled) {
    return this.execute(job)
  }

  if (scheduled - now <= 120) {
    // Lets use SQS for shortterm storage.
    // Skip writing to dynamo if job status is already in the sqs stage
    const isBouncing = job.status === 'QUEUED'
    job.status = 'QUEUED'

    // lets aim somewhere in the middle of the margin
    const remainingSecondsWithMargin = scheduled - (now + EXECUTION_MARGIN_IN_SECONDS / 2)
    await sqs.sendDelayedMessage(JSON.stringify(job), Math.min(remainingSecondsWithMargin, 15 * 60))

    if (isBouncing) return job
  } else {
    // Route to longterm storage in DynamoDB
    await eventbridge.schedule(job.id, (scheduled - 120) * 1000)
    job.status = 'STORED'
  }

  await jobs.put(job)
  return job
}

exports.execute = async (job) => {
  job.status = 'RUNNING'
  await jobs.put(job)

  job.executedAt = new Date().toJSON()
  job.status = 'DONE'

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
  }).catch(err => {
    if (err.toString().toLowerCase().includes('timeout')) {
      return {
        statusCode: 504,
        body: 'Scheduler timed out while waiting for a response from the job endpoint.',
      }
    }
    throw err
  })

  if (response.statusCode > 399) {
    console.warn('Endpoint returned 4xx or 5xx!', { job, response })
  }

  await jobs.put(job)
  return job
}
