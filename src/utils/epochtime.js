/**
 *
 * @param {string} dateString
 * @returns {number} Seconds since epoch
 */
exports.fromDate = (dateString) => {
  const date = new Date(dateString)
  return Math.floor(date.valueOf() / 1000)
}

/**
 *
 * @param {number} epochSeconds
 * @returns {string} ISO8601 datetime
 */
exports.toDate = (epochSeconds) => {
  const date = new Date(epochSeconds * 1000)
  return date.toJSON()
}
