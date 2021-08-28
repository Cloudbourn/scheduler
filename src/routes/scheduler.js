
const { v4: uuid } = require('uuid')
const jobs = require('../models/jobs')

module.exports = exports = (api) => {
  api.get('/jobs', async (req, res) => {
    return jobs.list()
  })

  api.post('/jobs', async (req, res) => {
    const {
      id = '',
      endpoint,
      executeAt,
      createdAt = new Date().toJSON(),
      updatedAt = new Date().toJSON(),
    } = req.body

    const exists = id ? await jobs.getById(id) : false
    if (id && !exists) {
      return res.status(404).send({ error: 'Job ID does not exist. To create a new job, omit the ID.' })
    }

    if (!endpoint) {
      return res.status(400).send({ error: 'endpoint is required.' })
    }

    if (!executeAt) {
      return res.status(400).send({ error: 'executeAt is required.' })
    }

    const job = {
      id: id || uuid(),
      endpoint,
      executeAt,
      createdAt: exists ? exists.createdAt : createdAt,
      updatedAt: updatedAt,
    }

    await jobs.put(job)
    return job
  })
}
