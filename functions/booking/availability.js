function computeFreeIntervals(openAt, closeAt, blocked) {
  const free = []
  let cursor = openAt

  const sorted = blocked.sort((a, b) => a.startAt - b.startAt)

  for (const b of sorted) {
    if (cursor < b.startAt) {
      free.push({ startAt: cursor, endAt: b.startAt })
    }
    cursor = new Date(Math.max(cursor, b.endAt))
  }

  if (cursor < closeAt) {
    free.push({ startAt: cursor, endAt: closeAt })
  }

  return free
}

function cloneAvailability(avail) {
  const out = {}
  for (const staffId in avail) {
    out[staffId] = avail[staffId].map((i) => ({
      startAt: new Date(i.startAt),
      endAt: new Date(i.endAt)
    }))
  }
  return out
}

module.exports = {
  computeFreeIntervals,
  cloneAvailability
}
