const { admin } = require('../firebaseAdmin')

const { normalizeToDate } = require('./dates')

const { overlaps } = require('./utils')

const { loadCustomerBookings } = require('./firestore')

const { getStaffBlockedIntervals } = require('./calendars')

function serializeTimeline(timeline) {
  return {
    startAt: admin.firestore.Timestamp.fromDate(timeline.startAt),
    endAt: admin.firestore.Timestamp.fromDate(timeline.endAt),
    segments: timeline.segments.map((s) => ({
      serviceId: s.serviceId,
      staffId: s.staffId,
      startAt: admin.firestore.Timestamp.fromDate(s.startAt),
      endAt: admin.firestore.Timestamp.fromDate(s.endAt)
    }))
  }
}
async function validateTimeline(timeline, userId) {
  const customerBookings = await loadCustomerBookings(userId)

  for (const seg of timeline.segments) {
    const start = normalizeToDate(seg.startAt)
    const end = normalizeToDate(seg.endAt)

    if (customerBookings.some((b) => overlaps(b.startAt, b.endAt, start, end))) {
      return { valid: false, reason: 'Customer not available' }
    }

    const blocked = await getStaffBlockedIntervals(seg.staffId, seg.startAt)
    if (blocked.some((b) => overlaps(b.startAt, b.endAt, start, end))) {
      return { valid: false, reason: 'Staff not available' }
    }
  }

  return { valid: true }
}
module.exports = {
  serializeTimeline,
  validateTimeline
}
