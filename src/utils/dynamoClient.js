
const {
  AWS_REGION = 'eu-west-1',
} = process.env

const { DynamoPlus } = require('dynamo-plus')
const dynamoClient = DynamoPlus({
  region: AWS_REGION,
  convertEmptyValues: true,
})

module.exports = exports = dynamoClient
