const { Converter: { unmarshall } } = require('aws-sdk/clients/dynamodb')
const timers = require('./models/timers')

/**
 * Handler for DynamoDB Stream events.
 * Ignores all events except the automatically deleted TTL items.
 * @type {AWSLambda.DynamoDBStreamHandler}
 */
exports.handler = async ({ Records }) => {
  for (const record of Records) {
    if (record.eventName === 'REMOVE') {
      const job = unmarshall(record.dynamodb.OldImage)
      // Check if it was done manually or triggered by the TTL timer.
      // Manual deletions should be respected (i.e. ignored).
      // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-streams.html
      if (
        record.userIdentity &&
        record.userIdentity.type === 'Service' &&
        record.userIdentity.principalId === 'dynamodb.amazonaws.com'
      ) {
        // Strip the TTL from the job since we want to reinsert it with just the status from now on.
        const { ttlUnixSeconds, ...cleanJob } = job

        // Now let the timer loop decide what happens next
        await timers.scheduleOrRun(cleanJob)
      } else {
        console.log('Manually deleted entry', job)
      }
    }
  }
}
