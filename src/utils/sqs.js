const SQS = require('aws-sdk/clients/sqs')

const {
  AWS_REGION = 'eu-west-1',
  TIMER_QUEUE_URL,
} = process.env

const sqs = new SQS({ region: AWS_REGION })

/**
 * @param {string} message
 * @param {number} delaySeconds Seconds between 0 and 900
 * @returns
 */
exports.sendDelayedMessage = async (message, delaySeconds = 0) => {
  if (delaySeconds > 15 * 60) throw new Error('SQS can only delay messages up to 15 minutes.')

  const sqsParams = {
    QueueUrl: TIMER_QUEUE_URL,
    MessageBody: message,
    DelaySeconds: delaySeconds,

  }
  return sqs.sendMessage(sqsParams).promise()
}
