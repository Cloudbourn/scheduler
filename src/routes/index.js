
const { v4: uuid } = require('uuid')
const jobs = require('../models/jobs')
const timers = require('../models/timers')

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
    // TODO: Assert that its a valid URL

    if (!scheduleAt) {
      return res.status(400).send({ error: 'scheduleAt is required.' })
    }
    // TODO: Assert that its a valid RFC 8601 datetime (or at least JS Date constructor)

    const job = {
      id: uuid(),
      endpoint,
      method,
      body,
      scheduleAt,
      createdAt: new Date().toJSON(),
    }

    await jobs.put(job)

    await timers.scheduleOrRun(job)

    return jobs.formatForApi(job)
  })
}
