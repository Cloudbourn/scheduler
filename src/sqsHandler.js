const jobs = require('./models/jobs')
const timers = require('./models/timers')

/**
 * Parse incoming SQS messages and retrieves the Job from DynamoDB
 */
exports.handler = async (event) => {
  for (const record of event.Records) {
    const jobId = record.body
    const job = await jobs.getById(jobId)
    await timers.scheduleOrRun(job)
  }
}
