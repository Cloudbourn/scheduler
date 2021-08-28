require('dotenv').config()

exports.apiHandler = require('./apiHandler').handler
exports.dynamoHandler = require('./dynamoHandler').handler
