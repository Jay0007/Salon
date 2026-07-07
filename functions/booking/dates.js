function normalizeToDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    return isNaN(value) ? null : value
  }

  // Firestore Timestamp
  if (typeof value.toDate === 'function') {
    const d = value.toDate()
    return isNaN(d) ? null : d
  }

  // Callable-serialized Timestamp
  if (value._seconds != null) {
    const d = new Date(value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1e6))
    return isNaN(d) ? null : d
  }

  // ISO string
  if (typeof value === 'string') {
    const d = new Date(value)
    return isNaN(d) ? null : d
  }

  return null
}

function addMinutes(date, mins) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return new Date(date.getTime() + mins * 60000)
}
module.exports = {
  normalizeToDate,
  addMinutes
}
