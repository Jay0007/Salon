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

exports.createBooking = onCall(async (request) => {
  assertAuth(request)

  const { serviceId, serviceName, date, time } = request.data
  const uid = request.auth.uid

  if (!serviceId || !serviceName || !date || !time) {
    throw new HttpsError('invalid-argument', 'Missing booking details')
  }

  const bookingRef = db.collection('bookings').doc()

  await bookingRef.set({
    userId: uid,
    serviceId,
    serviceName,
    date,
    time,
    status: 'confirmed',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, bookingId: bookingRef.id }
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
