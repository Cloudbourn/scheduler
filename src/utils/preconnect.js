const net = require('net')

/**
 * Establishes a connection to a host so that we don't have to
 * spend time on that when we want to execute the job.
 * The returned socket can be passed to phin via
 * `createConnection` which is part of http.request() options
 *
 * @returns {Function} A createConnection
 */
exports.preConnectSocket = async (endpoint) => {
  const parsedUrl = new URL(endpoint)
  const {
    protocol,
    hostname: host,
    port: parsedPort,
  } = parsedUrl

  const port = parsedPort || (protocol === 'https:'
    ? '443'
    : '80')

  const netSocket = net.createConnection({ host, port })
  return () => netSocket
}
