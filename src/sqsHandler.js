const timers = require('./models/timers')

/**
 * Parse incoming SQS messages and retrieves the Job from DynamoDB
 */
exports.handler = async (event) => {
  for (const record of event.Records) {
    const job = JSON.parse(record.body)
    await timers.scheduleOrRun(job)
  }
}
