const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

function assertAdmin(context) {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required')
  }
}

/**
 * Create a new booking (server-side only), Called from Vue using httpsCallable
 */
exports.createBooking = functions.https.onCall(async (data, context) => {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a booking.'
    )
  }

  const uid = context.auth.uid

  // 2. Validate input
  const { serviceId, serviceName, date, time } = data

  if (!serviceId || !serviceName || !date || !time) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing booking details.')
  }

  // 3. Create booking
  const bookingRef = db.collection('bookings').doc()

  const bookingData = {
    userId: uid,
    serviceId,
    serviceName,
    date, // e.g. "2025-01-15"
    time, // e.g. "14:30"
    status: 'confirmed',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }

  await bookingRef.set(bookingData)

  // 4. Return response
  return {
    success: true,
    bookingId: bookingRef.id
  }
})

/**
 * Cancel a booking (user can cancel only their own booking)
 */
exports.cancelBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.')
  }

  const { bookingId } = data

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'Booking ID is required.')
  }

  const uid = context.auth.uid
  const bookingRef = db.collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()

  if (!bookingSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Booking not found.')
  }

  const bookingData = bookingSnap.data()

  // User can cancel ONLY their own booking
  if (bookingData.userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'You cannot cancel this booking.')
  }

  await bookingRef.update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return {
    success: true
  }
})

/**
 * Reschedule a booking
 */
exports.rescheduleBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required')
  }

  const { bookingId, newStartAt, newEndAt } = data
  const uid = context.auth.uid

  if (!bookingId || !newStartAt || !newEndAt) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing reschedule details')
  }

  const bookingRef = db.collection('bookings').doc(bookingId)
  const snap = await bookingRef.get()

  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Booking not found')
  }

  const booking = snap.data()

  if (booking.userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your booking')
  }

  if (booking.status === 'cancelled') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Cancelled booking cannot be rescheduled'
    )
  }

  const now = new Date()
  if (booking.endAt.toDate() < now) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Past booking cannot be rescheduled'
    )
  }

  // --- TIME SLOT CONFLICT CHECK (SEE PART 3) ---
  const conflictQuery = await db
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .where('startAt', '<', newEndAt)
    .where('endAt', '>', newStartAt)
    .get()

  const conflict = conflictQuery.docs.find((d) => d.id !== bookingId)

  if (conflict) {
    throw new functions.https.HttpsError('already-exists', 'Selected time slot is not available')
  }

  await bookingRef.update({
    startAt: admin.firestore.Timestamp.fromDate(new Date(newStartAt)),
    endAt: admin.firestore.Timestamp.fromDate(new Date(newEndAt)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

exports.createStaff = functions.https.onCall(async (data, context) => {
  assertAdmin(context)

  const { name, services, isActive } = data

  if (!name || !Array.isArray(services) || services.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Staff name and services are required')
  }

  const staffRef = db.collection('staff').doc()

  await staffRef.set({
    name,
    services,
    isActive: isActive !== false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, staffId: staffRef.id }
})

exports.updateStaff = functions.https.onCall(async (data, context) => {
  assertAdmin(context)

  const { staffId, name, services, isActive } = data

  if (!staffId) {
    throw new functions.https.HttpsError('invalid-argument', 'Staff ID required')
  }

  await db.collection('staff').doc(staffId).update({
    name,
    services,
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})
exports.toggleStaffStatus = functions.https.onCall(async (data, context) => {
  assertAdmin(context)

  const { staffId, isActive } = data

  if (!staffId) {
    throw new functions.https.HttpsError('invalid-argument', 'Staff ID required')
  }

  await db.collection('staff').doc(staffId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

exports.createService = functions.https.onCall(async (data, context) => {
  assertAdmin(context)

  const { name, category, price, duration } = data

  if (!name || !category || !price || !duration) {
    throw new functions.https.HttpsError('invalid-argument', 'All service fields are required')
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
exports.updateService = functions.https.onCall(async (data, context) => {
  assertAdmin(context)

  const { serviceId, name, category, price, duration } = data

  if (!serviceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Service ID required')
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
exports.toggleServiceStatus = functions.https.onCall(async (data, context) => {
  assertAdmin(context)

  const { serviceId, isActive } = data

  if (!serviceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Service ID required')
  }

  await db.collection('services').doc(serviceId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})
exports.makeMeAdmin = functions.https.onCall(async (data, context) => {
  await admin.auth().setCustomUserClaims(context.auth.uid, { admin: true })
  return { success: true }
})
