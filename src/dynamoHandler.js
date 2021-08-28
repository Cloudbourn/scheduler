const { Converter: { unmarshall } } = require('aws-sdk/clients/dynamodb')
const jobs = require('./models/jobs')
const metrics = require('./utils/metrics')

/**
 * @type {AWSLambda.DynamoDBStreamHandler}
 */
exports.handler = async ({ Records }) => {
  for (const record of Records) {
    if (record.eventName === 'REMOVE') {
      const job = unmarshall(record.dynamodb.OldImage)
      // If it was a deletion, we need to check if it was done manually or triggered by the TTL timer.
      // Manual deletions should be respected (i.e. ignored).
      // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-streams.html
      if (
        record.userIdentity &&
        record.userIdentity.type === 'Service' &&
        record.userIdentity.principalId === 'dynamodb.amazonaws.com'
      ) {
        const now = Date.now()

        console.log('Executing job', job)
        await jobs.execute(job)

        // Store a metric to compare the millisecond difference between executeAt and actual time
        const executeAt = job.ttlUnixSeconds * 1000
        const diff = now - executeAt
        await metrics.putDeviation(diff)
      } else {
        console.log('Manually deleted entry', job)
      }
    }
  }
}
