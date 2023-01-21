const { Resolver } = require('dns').promises
const resolver = new Resolver()

// Cloudflare and Google, respectively
resolver.setServers(['1.1.1.1', '8.8.8.8'])

const resolverCache = new Map()

/**
 * Verifies that a URL is properly formatted and DNS-resolvable
 *
 * @param {string} url
 * @returns {string|undefined} a string with any validation error encountered
 */
exports.findUrlError = async (url) => {
  try {
    // The WHATWG URL parser does a lot of the heavy lifting like trimming and port validation
    const parsedUrl = new URL(url)

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'endpoint must use HTTP(S).'
    }

    const { hostname } = parsedUrl
    if (resolverCache.has(hostname)) {
      return resolverCache.get(hostname)
    }
    await resolver.resolve(hostname)
    // If the resolver didn't throw, we'll consider it valid enough
    resolverCache.set(hostname)
  } catch (err) {
    if (err.code === 'ERR_INVALID_URL') {
      return 'endpoint must be a valid URL.'
    }
    if (err.code === 'ENOTFOUND') {
      const urlError = 'endpoint hostname is not resolvable.'
      resolverCache.set(err.hostname, urlError)
      return urlError
    }
    throw err
  }
}
