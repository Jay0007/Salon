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

async function findAvailableSlots(serviceIds, preferredStaffMap = {}, startDate) {
  const { totalDuration, totalPrice } = await loadServices(serviceIds)
  const staff = await loadStaff()
  const results = []

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
      const staffAssignments = {}
      let valid = true

      for (const serviceId of serviceIds) {
        const preferred = preferredStaffMap[serviceId]

        const eligible = staff
          .filter(
            (s) =>
              s.services.includes(serviceId) &&
              (!preferred || preferred === 'ANY' || s.id === preferred)
          )
          .sort(() => Math.random() - 0.5) // ✅ load balancing

        let assigned = null

        for (const s of eligible) {
          const conflicts = bookings.some(
            (b) =>
              b.staffAssignments?.[serviceId] === s.id &&
              overlaps(slot, slotEnd, b.startAt, b.endAt)
          )
          if (!conflicts) {
            assigned = s.id
            break
          }
        }

        if (!assigned) {
          valid = false
          break
        }

        staffAssignments[serviceId] = assigned
      }

      if (!valid) continue

      results.push({
        startAt: new Date(slot),
        endAt: slotEnd,
        staffAssignments,
        totalDuration,
        totalPrice
      })

      if (results.length >= 10) return results
    }
  }

  return results
}

async function validateSlot({ serviceIds, preferredStaffMap, startDate, endDate }) {
  const staff = await loadStaff()
  const bookings = await loadBookings(startDate, endDate)
  const { totalDuration, totalPrice } = await loadServices(serviceIds)

  const staffAssignments = {}

  for (const serviceId of serviceIds) {
    const preferred = preferredStaffMap[serviceId]

    const eligible = staff.filter(
      (s) =>
        s.services.includes(serviceId) && (!preferred || preferred === 'ANY' || s.id === preferred)
    )

    let assigned = null

    for (const s of eligible) {
      const conflict = bookings.some(
        (b) =>
          b.staffAssignments?.[serviceId] === s.id &&
          overlaps(startDate, endDate, b.startAt, b.endAt)
      )

      if (!conflict) {
        assigned = s.id
        break
      }
    }

    if (!assigned) {
      return { available: false, reason: `No staff available for service` }
    }

    staffAssignments[serviceId] = assigned
  }

  return {
    available: true,
    staffAssignments,
    totalDuration,
    totalPrice
  }
}

module.exports = { findAvailableSlots, validateSlot }
