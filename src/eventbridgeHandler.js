const eventbridge = require('./utils/eventbridge')
const jobs = require('./models/jobs')
const timers = require('./models/timers')

/**
 * Handler for EventBridge Scheduler events.
 * @param {string} jobId
 */
exports.handler = async (jobId) => {
  // remove the schedule since it has been used
  await eventbridge.deleteSchedule(jobId)

  // fetch the job from dynamodb and run it through the job executor
  const job = await jobs.getById(jobId)
  await timers.scheduleOrRun(job)
}
