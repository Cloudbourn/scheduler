const { v4: uuid } = require('uuid')
const jobs = require('../models/jobs')
const timers = require('../models/timers')
const { findUrlError } = require('../utils/endpointValidation')

module.exports = exports = (api) => {
  api.get('/jobs', async (req, res) => {
    return jobs.list()
  })

  api.get('/jobs/:id', async (req, res) => {
    const { id } = req.params

    const job = await jobs.getById(id)
    if (!job) {
      return res.status(404).send({ error: 'Job ID does not found.' })
    }

    return jobs.formatForApi(job)
  })

  api.post('/jobs', async (req, res) => {
    const {
      endpoint,
      method = 'GET',
      body = undefined,
      scheduleAt,
    } = req.body

    if (!endpoint) {
      return res.status(400).send({ error: 'endpoint is required.' })
    }

    // URL may not be longer than 1kb
    if (endpoint.length > 1000) {
      return res.status(400).send({ error: 'endpoint can not exceed 1kb.' })
    }

    // URL validity
    const urlError = await findUrlError(endpoint)
    if (urlError) {
      return res.status(400).send({ error: urlError })
    }

    // stick to the HTTP methods we know and love
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return res.status(400).send({ error: 'Unsupported method.' })
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && typeof body === 'undefined') {
      return res.status(400).send({ error: `body is required for ${method}.` })
    }

    // if there is a payload
    if (typeof body !== 'undefined' && JSON.stringify(body).length > 1000) {
      return res.status(400).send({ error: 'body can not exceed 1kb.' })
    }

    if (!scheduleAt) {
      return res.status(400).send({ error: 'scheduleAt is required.' })
    }

    if (!new Date(scheduleAt).toJSON()) {
      return res.status(400).send({ error: 'scheduleAt must be compliant with RFC 3339.' })
    }

    const job = {
      id: uuid(),
      endpoint,
      method,
      body,
      scheduleAt: new Date(scheduleAt).toJSON(), // casts scheduleAt to UTC
      createdAt: new Date().toJSON(),
    }

    await jobs.put(job)

    await timers.scheduleOrRun(job)

    return jobs.formatForApi(job)
  })
}
