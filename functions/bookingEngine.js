// functions/bookingEngine.js
const { db, admin } = require('./firebaseAdmin')

/* ======================================================
   CONSTANTS
====================================================== */

const SLOT_STEP_MINUTES = 15
const DEBUG = true

function dbg(...args) {
  if (DEBUG) console.log('[BOOKING-ENGINE]', ...args)
}

/* ======================================================
   BASIC HELPERS
====================================================== */

function addMinutes(date, mins) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return new Date(date.getTime() + mins * 60000)
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}
function roundUpToSlot(date, stepMinutes) {
  const d = new Date(date)
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes()
  const rounded = Math.ceil(minutes / stepMinutes) * stepMinutes

  const h = Math.floor(rounded / 60)
  const m = rounded % 60

  d.setUTCHours(h, m, 0, 0)
  return d
}

/* ======================================================
   SALON SETTINGS
====================================================== */

async function getSalonSettings() {
  const snap = await db.collection('settings').doc('salon').get()
  if (!snap.exists) {
    return {
      openHour: 10,
      closeHour: 20,
      timezoneOffsetMinutes: 330
    }
  }
  return snap.data()
}

function setTimeInSalonTimezone(baseDate, hour, minute, offsetMinutes) {
  const d = new Date(baseDate)
  const utcMinutes = hour * 60 + minute - offsetMinutes
  d.setUTCHours(0, utcMinutes, 0, 0)
  return d
}

/* ======================================================
   LOADERS
====================================================== */

async function loadServices(serviceIds) {
  const snaps = await Promise.all(serviceIds.map((id) => db.collection('services').doc(id).get()))

  const services = {}
  snaps.forEach((s, i) => {
    if (!s.exists) throw new Error(`Service not found: ${serviceIds[i]}`)
    services[serviceIds[i]] = {
      id: serviceIds[i],
      duration: s.data().duration,
      price: s.data().price
    }
  })

  return services
}

async function loadStaff() {
  const snap = await db.collection('staff').where('isActive', '==', true).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

async function loadCustomerBookings(userId) {
  if (!userId) return []

  const snap = await db
    .collection('bookings')
    .where('userId', '==', userId)
    .where('status', '==', 'confirmed')
    .get()

  return snap.docs.map((d) => ({
    startAt: d.data().startAt.toDate(),
    endAt: d.data().endAt.toDate()
  }))
}

/* ======================================================
   STAFF CALENDARS
====================================================== */

async function getStaffBlockedIntervals(staffId, dateISO) {
  const dateKey = dateISO.slice(0, 10)
  const docId = `${staffId}_${dateKey}`
  const snap = await db.collection('staffCalendars').doc(docId).get()

  if (!snap.exists) return []

  return snap.data().blocked.map((b) => ({
    startAt: new Date(b.startAt),
    endAt: new Date(b.endAt)
  }))
}

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

/* ======================================================
   SERIALIZATION (MANDATORY)
====================================================== */

function serializeTimeline(timeline) {
  return {
    startAt: timeline.startAt.toISOString(),
    endAt: timeline.endAt.toISOString(),
    segments: timeline.segments.map((s) => ({
      serviceId: s.serviceId,
      staffId: s.staffId,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString()
    }))
  }
}

/* ======================================================
   CORE TIMELINE SOLVER (NO GAPS, REORDERING ALLOWED)
====================================================== */
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
function timelineSignature(segments) {
  return segments.map((s) => `${s.serviceId}:${s.staffId}:${s.startAt.toISOString()}`).join('|')
}
async function findAvailableTimelines({ date, serviceIds, preferredStaffMap = {}, userId }) {
  const salon = await getSalonSettings()
  const services = await loadServices(serviceIds)
  const staff = await loadStaff()
  const customerBookings = await loadCustomerBookings(userId)

  const openAt = setTimeInSalonTimezone(date, salon.openHour, 0, salon.timezoneOffsetMinutes)
  const closeAt = setTimeInSalonTimezone(date, salon.closeHour, 0, salon.timezoneOffsetMinutes)
  const now = new Date()
  const salonNow = new Date(now.getTime() + salon.timezoneOffsetMinutes * 60000)

  const bookingDate = openAt.toISOString().slice(0, 10)
  const today = salonNow.toISOString().slice(0, 10)

  let earliestStart = openAt

  if (bookingDate === today) {
    earliestStart = roundUpToSlot(salonNow, SLOT_STEP_MINUTES)

    // never allow before salon open
    if (earliestStart < openAt) {
      earliestStart = openAt
    }
  }
  const baseAvailability = {}

  for (const s of staff) {
    const blocked = await getStaffBlockedIntervals(s.id, date.toISOString())
    baseAvailability[s.id] = computeFreeIntervals(openAt, closeAt, blocked)
  }

  const timelines = []
  const seen = new Set()
  for (let t = new Date(earliestStart); t < closeAt; t = addMinutes(t, SLOT_STEP_MINUTES)) {
    dbg('==============================')
    dbg('Trying base slot:', t.toISOString())
    const remaining = [...serviceIds]
    const segments = []
    const staffAvailability = cloneAvailability(baseAvailability)

    let baseCursor = new Date(t) // ✅ FIX 1: base cursor per timeline

    while (remaining.length) {
      let placed = false

      for (const serviceId of [...remaining]) {
        const service = services[serviceId]
        const pref = preferredStaffMap?.[serviceId]

        // ✅ FIX 2: try ALL eligible staff independently
        const eligibleStaff = staff.filter(
          (s) => s.services.includes(serviceId) && (!pref || pref === 'ANY' || pref === s.id)
        )
        dbg('Remaining services:', remaining)
        dbg('Current cursor:', baseCursor.toISOString())
        for (const s of eligibleStaff) {
          const free = staffAvailability[s.id]
          dbg(`→ Checking staff ${s.id} for service ${serviceId}`)
          for (const f of free) {
            dbg(`   Free window: ${f.startAt.toISOString()} → ${f.endAt.toISOString()}`)
            const start = baseCursor > f.startAt ? baseCursor : f.startAt
            const end = addMinutes(start, service.duration)

            if (end > f.endAt) {
              dbg(`   ❌ Reject: duration overflow (ends at ${end.toISOString()})`)
              continue
            }

            // customer availability
            if (customerBookings.some((b) => overlaps(b.startAt, b.endAt, start, end))) {
              dbg(`   ❌ Reject: customer busy ${start.toISOString()} → ${end.toISOString()}`)
              continue
            }

            // ✅ PLACE SEGMENT
            segments.push({
              serviceId,
              staffId: s.id,
              startAt: start,
              endAt: end
            })
            dbg(
              `   ✅ Placed service ${serviceId} with staff ${s.id}`,
              `${start.toISOString()} → ${end.toISOString()}`
            )

            // ✅ REMOVE USED TIME FROM THIS STAFF ONLY
            staffAvailability[s.id] = free
              .map((i) => {
                if (i.endAt <= start || i.startAt >= end) return i
                const parts = []
                if (i.startAt < start) parts.push({ startAt: i.startAt, endAt: start })
                if (end < i.endAt) parts.push({ startAt: end, endAt: i.endAt })
                return parts
              })
              .flat()

            // ✅ FIX 3: advance cursor ONLY after placement
            baseCursor = end

            remaining.splice(remaining.indexOf(serviceId), 1)
            placed = true
            break
          }
          if (placed) break
        }
        if (placed) break
      }

      if (!placed) break
    }

    if (!remaining.length) {
      dbg(
        '🎉 SLOT ACCEPTED:',
        segments.map((s) => ({
          service: s.serviceId,
          staff: s.staffId,
          start: s.startAt.toISOString(),
          end: s.endAt.toISOString()
        }))
      )
      const sig = timelineSignature(segments)
      if (seen.has(sig)) continue
      seen.add(sig)

      timelines.push({
        startAt: segments[0].startAt,
        endAt: segments[segments.length - 1].endAt,
        segments
      })
    }
  }

  return timelines.map(serializeTimeline)
}

/* ======================================================
   VALIDATION (USED BY CREATE / RESCHEDULE)
====================================================== */

async function validateTimeline(timeline, userId) {
  const customerBookings = await loadCustomerBookings(userId)

  for (const seg of timeline.segments) {
    const start = new Date(seg.startAt)
    const end = new Date(seg.endAt)

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

/* ======================================================
   STAFF CALENDAR BLOCK / UNBLOCK
====================================================== */

async function blockStaffCalendarPerSegment(segments) {
  for (const seg of segments) {
    const dateKey = seg.startAt.slice(0, 10)
    const ref = db.collection('staffCalendars').doc(`${seg.staffId}_${dateKey}`)

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const blocked = snap.exists ? snap.data().blocked || [] : []

      blocked.push({ startAt: seg.startAt, endAt: seg.endAt })

      tx.set(
        ref,
        {
          staffId: seg.staffId,
          date: dateKey,
          blocked,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      )
    })
  }
}

async function unblockStaffCalendarPerSegment(segments) {
  for (const seg of segments) {
    const dateKey = seg.startAt.slice(0, 10)
    const ref = db.collection('staffCalendars').doc(`${seg.staffId}_${dateKey}`)

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return

      const blocked = (snap.data().blocked || []).filter(
        (b) => !(b.startAt === seg.startAt && b.endAt === seg.endAt)
      )

      tx.set(ref, { blocked }, { merge: true })
    })
  }
}

/* ======================================================
   STAFF UTILIZATION (ADMIN)
====================================================== */

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
  getSalonSettings
}
