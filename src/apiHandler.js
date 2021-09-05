const api = require('./utils/api')

api.register(require('./routes/index'))

// Declare actual Lambda handler
exports.handler = async (event, context) => {
  // Run the request
  return api.run(event, context)
}
