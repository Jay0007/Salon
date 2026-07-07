const { getSalonSettings } = require('./booking/firestore')

const { normalizeToDate, addMinutes } = require('./booking/dates')

const {
  blockStaffCalendarPerSegment,
  unblockStaffCalendarPerSegment
} = require('./booking/calendars')

const { validateTimeline } = require('./booking/timeline')

const { findAvailableTimelines } = require('./booking/scheduler')

function calculateStaffUtilization(freeIntervals, openAt, closeAt) {
  const totalMinutes = (closeAt - openAt) / 60000
  const freeMinutes = freeIntervals.reduce((sum, f) => sum + (f.endAt - f.startAt) / 60000, 0)
  return (totalMinutes - freeMinutes) / totalMinutes
}

/* ======================================================
   EXPORTS
====================================================== */

module.exports = {
  findAvailableTimelines,
  validateTimeline,
  blockStaffCalendarPerSegment,
  unblockStaffCalendarPerSegment,
  calculateStaffUtilization,
  getSalonSettings,
  normalizeToDate
}
