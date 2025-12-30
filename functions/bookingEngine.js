// functions/bookingEngine.js
const { db, admin } = require('./firebaseAdmin')

const OPEN_HOUR = 10
const CLOSE_HOUR = 20
const SLOT_MINUTES = 15
const MAX_DAYS = 60

/* ---------------- HELPERS ---------------- */

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000)
}

/* ---------------- LOAD DATA ---------------- */

async function loadServices(serviceIds) {
  const snaps = await Promise.all(serviceIds.map((id) => db.collection('services').doc(id).get()))

  let totalDuration = 0
  let totalPrice = 0

  snaps.forEach((s) => {
    if (!s.exists || s.data().isActive !== true) {
      throw new Error('Service unavailable')
    }
    totalDuration += s.data().duration
    totalPrice += s.data().price
  })

  return { totalDuration, totalPrice }
}

async function loadStaff() {
  const snap = await db.collection('staff').where('isActive', '==', true).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

async function loadBookings(from, to) {
  const snap = await db
    .collection('bookings')
    .where('status', 'in', ['pending', 'confirmed'])
    .where('startAt', '<', to)
    .where('endAt', '>', from)
    .get()

  return snap.docs.map((d) => ({
    ...d.data(),
    startAt: d.data().startAt.toDate(),
    endAt: d.data().endAt.toDate()
  }))
}

/* ---------------- CORE ENGINE ---------------- */

async function findEarliestSlot(serviceIds, preferredStaffMap = {}, startDate) {
  const { totalDuration, totalPrice } = await loadServices(serviceIds)
  const staff = await loadStaff()

  for (let dayOffset = 0; dayOffset < MAX_DAYS; dayOffset++) {
    const day = new Date(startDate)
    day.setDate(day.getDate() + dayOffset)

    const dayStart = new Date(day)
    dayStart.setHours(OPEN_HOUR, 0, 0, 0)

    const dayEnd = new Date(day)
    dayEnd.setHours(CLOSE_HOUR, 0, 0, 0)

    const bookings = await loadBookings(dayStart, dayEnd)

    for (
      let slot = new Date(dayStart);
      addMinutes(slot, totalDuration) <= dayEnd;
      slot = addMinutes(slot, SLOT_MINUTES)
    ) {
      const slotEnd = addMinutes(slot, totalDuration)

      // Resolve staff per service
      const staffAssignments = {}

      for (const serviceId of serviceIds) {
        let assigned = null

        const eligible = staff.filter((s) => s.services.includes(serviceId))

        for (const s of eligible) {
          const conflicts = bookings.filter(
            (b) =>
              b.staffAssignments?.[serviceId] === s.id &&
              overlaps(slot, slotEnd, b.startAt, b.endAt)
          )

          if (!conflicts.length) {
            assigned = s.id
            break
          }
        }

        if (!assigned) {
          assigned = null
          break
        }

        staffAssignments[serviceId] = assigned
      }

      if (Object.values(staffAssignments).some((v) => !v)) continue

      return {
        startAt: slot,
        endAt: slotEnd,
        staffAssignments,
        totalDuration,
        totalPrice
      }
    }
  }

  return null
}

module.exports = { findEarliestSlot }
