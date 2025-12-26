const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

/* ---------------- Helpers ---------------- */

function assertAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required')
  }
}

function assertAdmin(request) {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin access required')
  }
}

/* ---------------- BOOKINGS ---------------- */

exports.createBooking = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Login required')
  }

  const { serviceIds, startAt, endAt } = data

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one service required')
  }
  if (!startAt || !endAt) {
    throw new HttpsError('invalid-argument', 'Missing time range')
  }

  const start = admin.firestore.Timestamp.fromDate(new Date(startAt))
  const end = admin.firestore.Timestamp.fromDate(new Date(endAt))

  /* 1️⃣ Load services */
  const serviceSnaps = await Promise.all(
    serviceIds.map((id) => db.collection('services').doc(id).get())
  )

  let totalDuration = 0
  let totalPrice = 0

  for (const snap of serviceSnaps) {
    if (!snap.exists || snap.data().isActive !== true) {
      throw new HttpsError('not-found', 'One or more services unavailable')
    }
    totalDuration += snap.data().duration
    totalPrice += snap.data().price
  }

  /* 2️⃣ Find eligible staff (must handle ALL services) */
  const staffSnap = await db.collection('staff').where('isActive', '==', true).get()

  if (staffSnap.empty) {
    throw new HttpsError('failed-precondition', 'No staff available')
  }

  let assignedStaffId = null

  for (const staffDoc of staffSnap.docs) {
    const staff = staffDoc.data()

    const canDoAll = serviceIds.every(
      (sid) => Array.isArray(staff.services) && staff.services.includes(sid)
    )
    if (!canDoAll) continue

    const conflictSnap = await db
      .collection('bookings')
      .where('staffId', '==', staffDoc.id)
      .where('status', '==', 'confirmed')
      .where('startAt', '<', end)
      .where('endAt', '>', start)
      .get()

    if (conflictSnap.empty) {
      assignedStaffId = staffDoc.id
      break
    }
  }

  if (!assignedStaffId) {
    throw new HttpsError('already-exists', 'No staff available for selected time')
  }

  /* 3️⃣ Create booking */
  const bookingRef = db.collection('bookings').doc()

  await bookingRef.set({
    userId: context.auth.uid,
    serviceIds,
    staffId: assignedStaffId,

    startAt: start,
    endAt: end,

    totalDuration,
    totalPrice,

    status: 'confirmed',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return {
    success: true,
    bookingId: bookingRef.id
  }
})

exports.cancelBooking = onCall(async (request) => {
  assertAuth(request)

  const { bookingId } = request.data
  const uid = request.auth.uid

  if (!bookingId) {
    throw new HttpsError('invalid-argument', 'Booking ID required')
  }

  const ref = db.collection('bookings').doc(bookingId)
  const snap = await ref.get()

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Booking not found')
  }

  if (snap.data().userId !== uid) {
    throw new HttpsError('permission-denied', 'Not your booking')
  }

  await ref.update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

exports.rescheduleBooking = onCall(async (request) => {
  assertAuth(request)

  const { bookingId, newStartAt, newEndAt } = request.data
  const uid = request.auth.uid

  if (!bookingId || !newStartAt || !newEndAt) {
    throw new HttpsError('invalid-argument', 'Missing reschedule details')
  }

  const ref = db.collection('bookings').doc(bookingId)
  const snap = await ref.get()

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Booking not found')
  }

  const booking = snap.data()

  if (booking.userId !== uid) {
    throw new HttpsError('permission-denied', 'Not your booking')
  }

  const conflicts = await db
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .where('startAt', '<', newEndAt)
    .where('endAt', '>', newStartAt)
    .get()

  if (conflicts.docs.some((d) => d.id !== bookingId)) {
    throw new HttpsError('already-exists', 'Time slot not available')
  }

  await ref.update({
    startAt: admin.firestore.Timestamp.fromDate(new Date(newStartAt)),
    endAt: admin.firestore.Timestamp.fromDate(new Date(newEndAt)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

/* ---------------- STAFF (ADMIN) ---------------- */

exports.createStaff = onCall(async (request) => {
  assertAdmin(request)

  const { name, services, isActive } = request.data

  if (!name || !Array.isArray(services) || !services.length) {
    throw new HttpsError('invalid-argument', 'Invalid staff data')
  }

  const ref = db.collection('staff').doc()

  await ref.set({
    name,
    services,
    isActive: isActive !== false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, staffId: ref.id }
})

exports.updateStaff = onCall(async (request) => {
  assertAdmin(request)

  const { staffId, name, services, isActive } = request.data

  if (!staffId) {
    throw new HttpsError('invalid-argument', 'Staff ID required')
  }

  await db.collection('staff').doc(staffId).update({
    name,
    services,
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

exports.toggleStaffStatus = onCall(async (request) => {
  assertAdmin(request)

  const { staffId, isActive } = request.data

  if (!staffId) {
    throw new HttpsError('invalid-argument', 'Staff ID required')
  }

  await db.collection('staff').doc(staffId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

/* ---------------- SERVICES (ADMIN) ---------------- */

exports.createService = onCall(async (request) => {
  assertAdmin(request)

  const { name, category, price, duration } = request.data

  if (!name || !category || !price || !duration) {
    throw new HttpsError('invalid-argument', 'Invalid service data')
  }

  const ref = db.collection('services').doc()

  await ref.set({
    name,
    category,
    price,
    duration,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, serviceId: ref.id }
})

exports.updateService = onCall(async (request) => {
  assertAdmin(request)

  const { serviceId, name, category, price, duration } = request.data

  if (!serviceId) {
    throw new HttpsError('invalid-argument', 'Service ID required')
  }

  await db.collection('services').doc(serviceId).update({
    name,
    category,
    price,
    duration,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

exports.toggleServiceStatus = onCall(async (request) => {
  assertAdmin(request)

  const { serviceId, isActive } = request.data

  if (!serviceId) {
    throw new HttpsError('invalid-argument', 'Service ID required')
  }

  await db.collection('services').doc(serviceId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

// /* ---------------- ADMIN BOOTSTRAP (TEMPORARY) ---------------- */

// exports.makeMeAdmin = onCall(async (request) => {
//   assertAuth(request)

//   await admin.auth().setCustomUserClaims(request.auth.uid, {
//     admin: true
//   })

//   return { success: true }
// })
