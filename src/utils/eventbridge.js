const { SchedulerClient, CreateScheduleCommand, UpdateScheduleCommand, DeleteScheduleCommand } = require('@aws-sdk/client-scheduler')

const {
  AWS_REGION = 'eu-west-1',
  ENVIRONMENT = '',
  EVENTBRIDGE_HANDLER_ARN = '',
  EVENTBRIDGE_ROLE_ARN = '',
  PROJECT = '',
} = process.env

const eventbridge = new SchedulerClient({ region: AWS_REGION })

/**
 * @param {Date|string|number} scheduledAt Something Date() can parse
 * @param {string} targetArn The ARN which will be invoked
 * @param message The payload that will be delivered to our target ARN
 * @returns
 */
exports.schedule = async (id, scheduledAt) => {
  // format the date as an UTC yyyy-mm-ddThh:mm:ss for eventbridge
  const targetDate = new Date(scheduledAt)
    .toJSON() // normalizes to UTC
    .split('.')[0] // strip fractions and TZ

  const schedulePayload = {
    GroupName: `${PROJECT}-${ENVIRONMENT}`,
    Name: id,
    FlexibleTimeWindow: { Mode: 'OFF' },
    ScheduleExpression: `at(${targetDate})`,
    Target: {
      Arn: EVENTBRIDGE_HANDLER_ARN,
      Input: JSON.stringify(id),
      RoleArn: EVENTBRIDGE_ROLE_ARN,
    },
  }

  try {
    const createResponse = await eventbridge.send(new CreateScheduleCommand(schedulePayload))
    return createResponse
  } catch (err) {
    // in case the schedule already exists, update it
    if (err.name && err.name === 'ConflictException') {
      const updateResponse = await eventbridge.send(new UpdateScheduleCommand(schedulePayload))
      return updateResponse
    }
    throw err
  }
}

exports.deleteSchedule = async (id) => {
  const command = new DeleteScheduleCommand({
    GroupName: `${PROJECT}-${ENVIRONMENT}`,
    Name: id,
  })
  return eventbridge.send(command)
}
