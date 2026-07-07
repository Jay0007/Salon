const { normalizeToDate, addMinutes } = require('./dates')
const { overlaps } = require('./utils')

const { computeFreeIntervals, cloneAvailability } = require('./availability')

const { loadServices, loadStaff, loadCustomerBookings, getSalonSettings } = require('./firestore')

const { getStaffBlockedIntervals } = require('./calendars')

const { serializeTimeline } = require('./timeline')

const { permutations } = require('./permutations')
/* ======================================================
   CONSTANTS
====================================================== */

const SLOT_STEP_MINUTES = 15
const DEBUG = false

function dbg(...args) {
  if (DEBUG) console.log('[BOOKING-ENGINE]', ...args)
}

/* ======================================================
   BASIC HELPERS
====================================================== */

function roundUpToSlot(date, stepMinutes) {
  const d = new Date(date)
  const minutes = d.getHours() * 60 + d.getMinutes()
  const rounded = Math.ceil(minutes / stepMinutes) * stepMinutes

  const h = Math.floor(rounded / 60)
  const m = rounded % 60

  d.setHours(h, m, 0, 0)
  return d
}

/* ======================================================
   CORE TIMELINE SOLVER (NO GAPS, REORDERING ALLOWED)
====================================================== */

function timelineSignature(segments) {
  return segments
    .map((s) => {
      const d = normalizeToDate(s.startAt)
      return `${s.serviceId}:${s.staffId}:${d?.toISOString()}`
    })
    .join('|')
}

function consumeInterval(intervals, start, end) {
  return intervals.flatMap((i) => {
    if (i.endAt <= start || i.startAt >= end) {
      return [i]
    }

    const out = []

    if (i.startAt < start) {
      out.push({
        startAt: i.startAt,
        endAt: start
      })
    }

    if (end < i.endAt) {
      out.push({
        startAt: end,
        endAt: i.endAt
      })
    }

    return out
  })
}

function scheduleServices({
  order,
  index,
  cursor,
  services,
  staff,
  preferredStaffMap,
  availability,
  customerBookings,
  segments
}) {
  if (index === order.length) {
    return segments
  }

  const serviceId = order[index]
  const service = services[serviceId]

  const preferred = preferredStaffMap?.[serviceId]

  const eligible = staff.filter(
    (s) =>
      s.services.includes(serviceId) && (!preferred || preferred === 'ANY' || preferred === s.id)
  )

  for (const employee of eligible) {
    const free = availability[employee.id]

    for (const slot of free) {
      // Staff must already be available when the previous service ends.
      // Do NOT allow waiting for the staff.
      if (slot.startAt > cursor) {
        continue
      }

      const start = new Date(cursor)
      const end = addMinutes(start, service.duration)

      if (end > slot.endAt) {
        continue
      }

      if (customerBookings.some((b) => overlaps(b.startAt, b.endAt, start, end))) {
        continue
      }

      const nextAvailability = cloneAvailability(availability)

      nextAvailability[employee.id] = consumeInterval(nextAvailability[employee.id], start, end)

      const result = scheduleServices({
        order,
        index: index + 1,
        cursor: end,
        services,
        staff,
        preferredStaffMap,
        availability: nextAvailability,
        customerBookings,
        segments: [
          ...segments,
          {
            serviceId,
            staffId: employee.id,
            startAt: start,
            endAt: end
          }
        ]
      })

      if (result) {
        return result
      }
    }
  }

  return null
}

async function findAvailableTimelines({ date, serviceIds, preferredStaffMap = {}, userId }) {
  const salon = await getSalonSettings()
  const services = await loadServices(serviceIds)
  const staff = await loadStaff()
  const customerBookings = await loadCustomerBookings(userId)

  const [y, m, d] = date.split('-').map(Number)

  const openAt = new Date(y, m - 1, d, salon.openHour, 0, 0, 0)
  const closeAt = new Date(y, m - 1, d, salon.closeHour, 0, 0, 0)

  let earliestStart = new Date(openAt)

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  if (date === todayKey) {
    earliestStart = roundUpToSlot(today, SLOT_STEP_MINUTES)

    if (earliestStart < openAt) {
      earliestStart = new Date(openAt)
    }
  }

  const baseAvailability = {}

  for (const s of staff) {
    const blocked = await getStaffBlockedIntervals(s.id, date)

    baseAvailability[s.id] = computeFreeIntervals(openAt, closeAt, blocked)
  }

  const orders = permutations(serviceIds)

  const timelines = []
  const seen = new Set()

  for (
    let start = new Date(earliestStart);
    start < closeAt;
    start = addMinutes(start, SLOT_STEP_MINUTES)
  ) {
    let bestTimeline = null

    for (const order of orders) {
      const availability = cloneAvailability(baseAvailability)

      const segments = scheduleServices({
        order,
        index: 0,
        cursor: new Date(start),
        services,
        staff,
        preferredStaffMap,
        availability,
        customerBookings,
        segments: []
      })

      if (!segments) {
        continue
      }

      const timeline = {
        startAt: segments[0].startAt,
        endAt: segments[segments.length - 1].endAt,
        segments
      }

      if (!bestTimeline || timeline.endAt < bestTimeline.endAt) {
        bestTimeline = timeline
      }
    }

    if (!bestTimeline) {
      continue
    }

    const sig = timelineSignature(bestTimeline.segments)

    if (seen.has(sig)) {
      continue
    }

    seen.add(sig)

    timelines.push(bestTimeline)
  }

  timelines.sort((a, b) => a.startAt - b.startAt)

  return timelines.map(serializeTimeline)
}

module.exports = {
  findAvailableTimelines
}
