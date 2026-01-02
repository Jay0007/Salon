// functions/bookingEngine.js
const { db, admin } = require('./firebaseAdmin')

const OPEN_HOUR = 10
const CLOSE_HOUR = 20
const SLOT_STEP_MINUTES = 15
const LOCK_DURATION_MINUTES = 5

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

  snaps.forEach((s, idx) => {
    if (!s.exists) {
      throw new Error(`Service not found: ${serviceIds[idx]}`)
    }

    const d = s.data()

    if (typeof d.duration !== 'number' || typeof d.price !== 'number') {
      throw new Error(`Invalid service data: ${serviceIds[idx]}`)
    }

    totalDuration += d.duration
    totalPrice += d.price
  })

  return { totalDuration, totalPrice }
}

async function loadStaff() {
  const snap = await db.collection('staff').where('isActive', '==', true).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => Array.isArray(s.services))
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
async function loadLocks(startAt, endAt) {
  const snap = await db
    .collection('slotLocks')
    .where('startAt', '<', endAt)
    .where('endAt', '>', startAt)
    .get()

  return snap.docs.map((d) => d.data())
}

/* ---------------- Staff selection ---------------- */

function selectStaff({ staff, serviceId, preferred, bookings, startAt, endAt }) {
  const eligible = staff
    .filter(
      (s) =>
        s.services.includes(serviceId) && (!preferred || preferred === 'ANY' || s.id === preferred)
    )
    .sort((a, b) => (a.priorityIndex || 0) - (b.priorityIndex || 0))

  for (const s of eligible) {
    const conflict = bookings.some(
      (b) =>
        b.staffAssignments?.[serviceId] === s.id && overlaps(startAt, endAt, b.startAt, b.endAt)
    )

    if (!conflict) return s.id
  }

  return null
}

/* ---------------- SLOT DISCOVERY (UI ONLY) ---------------- */

async function findAvailableSlots(serviceIds, preferredStaffMap, startDate) {
  const { totalDuration, totalPrice } = await loadServices(serviceIds)
  const staff = await loadStaff()
  const results = []

  const dayStart = new Date(startDate)
  dayStart.setHours(OPEN_HOUR, 0, 0, 0)

  const dayEnd = new Date(startDate)
  dayEnd.setHours(CLOSE_HOUR, 0, 0, 0)
  const dayBookings = await loadBookings(dayStart, dayEnd)
  const dayLocks = await loadLocks(dayStart, dayEnd)
  for (
    let slot = new Date(dayStart);
    addMinutes(slot, totalDuration) <= dayEnd;
    slot = addMinutes(slot, SLOT_STEP_MINUTES)
  ) {
    const slotEnd = addMinutes(slot, totalDuration)
    const bookings = dayBookings
    const locks = dayLocks

    if (locks.length) continue

    const staffAssignments = {}
    let valid = true

    for (const serviceId of serviceIds) {
      const staffId = selectStaff({
        staff,
        serviceId,
        preferred: preferredStaffMap?.[serviceId],
        bookings,
        startAt: slot,
        endAt: slotEnd
      })

      if (!staffId) {
        valid = false
        break
      }

      staffAssignments[serviceId] = staffId
    }

    if (valid) {
      results.push({
        startAt: slot.toISOString(),
        endAt: slotEnd.toISOString(),
        staffAssignments,
        totalDuration,
        totalPrice
      })
    }

    if (results.length >= 40) break
  }

  return results
}

/* ---------------- VALIDATION (BOOK / RESCHEDULE) ---------------- */

async function validateAndAssignStaff({ serviceIds, preferredStaffMap, startAt, endAt }) {
  const staff = await loadStaff()
  const bookings = await loadBookings(startAt, endAt)
  const locks = await loadLocks(startAt, endAt)

  if (locks.length) {
    return { available: false, reason: 'Slot temporarily locked' }
  }

  const staffAssignments = {}

  for (const serviceId of serviceIds) {
    const staffId = selectStaff({
      staff,
      serviceId,
      preferred: preferredStaffMap?.[serviceId],
      bookings,
      startAt,
      endAt
    })

    if (!staffId) {
      return { available: false, reason: 'No staff available' }
    }

    staffAssignments[serviceId] = staffId
  }

  const { totalDuration, totalPrice } = await loadServices(serviceIds)

  return {
    available: true,
    staffAssignments,
    totalDuration,
    totalPrice
  }
}

/* ---------------- SLOT LOCK ---------------- */

async function createSlotLock({ userId, startAt, endAt, staffAssignments }) {
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + LOCK_DURATION_MINUTES * 60000)
  )

  await db.collection('slotLocks').add({
    userId,
    startAt,
    endAt,
    staffAssignments,
    expiresAt
  })
}

/* ---------------- STAFF ROTATION ---------------- */

async function rotateStaffPriority(staffAssignments) {
  const batch = db.batch()

  Object.values(staffAssignments).forEach((staffId) => {
    const ref = db.collection('staff').doc(staffId)
    batch.update(ref, {
      priorityIndex: admin.firestore.FieldValue.increment(1)
    })
  })

  await batch.commit()
}

module.exports = {
  findAvailableSlots,
  validateAndAssignStaff,
  createSlotLock,
  rotateStaffPriority
}
