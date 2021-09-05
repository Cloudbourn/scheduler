const epochtime = require('../utils/epochtime')
const jobs = require('./jobs')
const phin = require('phin')
const sqs = require('../utils/sqs')

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

  if (scheduled - now <= 48 * 60 * 60) {
    // Lets use SQS for shortterm storage.
    await sqs.sendDelayedMessage(job.id, Math.min(scheduled - now, 15 * 60))
    job.status = 'QUEUED'
  } else {
    // Route to longterm storage in DynamoDB
    job.ttlUnixSeconds = epochtime.fromDate(job.scheduleAt)
    job.status = 'STORED'
  }

  await jobs.put(job)
  return job
}

exports.execute = async (job) => {
  job.status = 'RUNNING'
  await jobs.put(job)

  // TODO: this should use SQS to decouple HTTP errors from incoming event batches
  const response = await phin({
    url: job.endpoint,
    method: 'GET',
    headers: {
      'User-Agent': 'github:Sleavely/scheduler',
    },
    followRedirects: true,
    timeout: 500,
  })

  if (response.statusCode > 399) {
    console.error('Endpoint returned 4xx or 5xx!', { job })
  }

  job.executedAt = new Date().toJSON()
  job.status = 'DONE'
  await jobs.put(job)
  return job
}
