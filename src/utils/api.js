require('dotenv').config()
const {
  API_BASE_PATH = '',
  LOG_LEVEL = 'warn',
} = process.env

// Require the framework and instantiate it
const api = require('lambda-api')({
  base: API_BASE_PATH,
  logger: {
    level: LOG_LEVEL,
    access: true,
    detail: false,
    timestamp: false,
    stack: true,
  },
})

// Add CORS headers
api.options('/*', (req, res) => {
  res.cors().send({})
})
api.use((req, res, next) => {
  res.cors()
  next()
})
api.use((err, req, res, next) => {
  res.cors()
  // Passing err does nothing, but it calms the linter.
  next(err)
})

api.get('/routes', async () => {
  return api.routes()
})

module.exports = exports = api
