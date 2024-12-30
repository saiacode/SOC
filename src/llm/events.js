

const updateLastQuery = (io) => {
  io.emit('llmLastQuery', { lastQuery: new Date().toLocaleString() })
}

const updateAverageResponseTime = (io, averageResponseTime) => {
  io.emit('llmAverageResponseTime', { averageResponseTime })
}

const updateTotalQueries = (io, totalQueries) => {
  io.emit('llmTotalQueries', { totalQueries })
}

module.exports = {
  updateLastQuery,
  updateAverageResponseTime,
  updateTotalQueries
}