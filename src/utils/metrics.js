const {
  AWS_REGION = 'eu-west-1',
  PROJECT = '',
} = process.env

const CW = require('aws-sdk/clients/cloudwatch')
const cloudwatch = new CW({ region: AWS_REGION })

exports.putDeviation = async (milliseconds) => {
  const params = {
    MetricData: [
      {
        MetricName: 'DeviationFromSchedule',
        Value: Math.round(milliseconds / 1000),
        Unit: 'Seconds',
      },
    ],
    Namespace: PROJECT,
  }
  await cloudwatch.putMetricData(params).promise()
}
