
exports.fromDate = (dateString) => {
  const date = new Date(dateString)
  return Math.floor(date.valueOf() / 1000)
}

exports.toDate = (epochSeconds) => {
  const date = new Date(epochSeconds * 1000)
  return date.toJSON()
}
