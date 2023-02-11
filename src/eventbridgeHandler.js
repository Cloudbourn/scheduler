// const eventbridge = require("./utils/eventbridge")
// const jobs = require('./models/jobs')
// const timers = require('./models/timers')

/**
 * Handler for EventBridge Scheduler events.
 * @param {AWSLambda.ScheduledEvent} event
 * @type {AWSLambda.EventBridgeHandler}
 */
exports.handler = async (event) => {
  console.log({ event })
  // TODO: fetch the job from dynamodb and run it through the job executor
  // const job = await jobs.getById(event.Payload)
  // await timers.scheduleOrRun(job)

  // TODO: remove the schedule since it has been used
  // await eventbridge.deleteSchedule(job.id)
}
