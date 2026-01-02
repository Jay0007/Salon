const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { admin, db } = require('./firebaseAdmin')
const { findAvailableSlots, validateSlot } = require('./bookingEngine')

function assertAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required')
  }
}

function assertAdmin(request) {
  console.log('--- ASSERT ADMIN CHECK ---')

  if (!request.auth) {
    console.error('FAIL: No auth context')
    throw new HttpsError('unauthenticated', 'User is not authenticated')
  }

  console.log('UID:', request.auth.uid)
  console.log('Token claims:', JSON.stringify(request.auth.token, null, 2))

  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only')
  }

  console.log('PASS: Admin verified')
}

/* ---------------- AVAILABILITY ---------------- */

exports.getAvailableDates = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const { serviceIds } = request.data
  if (!serviceIds?.length) return []

  const dates = []
  const today = new Date()

  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)

    const result = await findAvailableSlots(serviceIds, {}, d)
    if (result) dates.push(d.toISOString().split('T')[0])
  }

  return dates
})

exports.getAvailableSlots = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const { serviceIds, date, preferredStaffMap } = request.data

  return await findAvailableSlots(serviceIds, preferredStaffMap || {}, new Date(date))
})

/* ---------------- BOOKINGS ---------------- */

exports.createBooking = onCall({ invoker: 'public' }, async (request) => {
  try {
    assertAuth(request)

    const { serviceIds, preferredStaffMap = {}, startAt, endAt, bookingFor } = request.data

    if (!Array.isArray(serviceIds) || !serviceIds.length) {
      throw new HttpsError('invalid-argument', 'Invalid services')
    }

    const startDate = new Date(startAt)
    const endDate = new Date(endAt)

    if (isNaN(startDate) || isNaN(endDate) || startDate >= endDate) {
      throw new HttpsError('invalid-argument', 'Invalid time window')
    }

    // 🔒 Atomic validation
    const availability = await validateSlot({
      serviceIds,
      preferredStaffMap,
      startDate,
      endDate
    })

    if (!availability.available) {
      throw new HttpsError('already-exists', availability.reason)
    }

    const ref = db.collection('bookings').doc()

    await ref.set({
      userId: request.auth.uid,
      bookingFor: bookingFor || null,

      serviceIds,
      staffAssignments: availability.staffAssignments,

      startAt: admin.firestore.Timestamp.fromDate(startDate),
      endAt: admin.firestore.Timestamp.fromDate(endDate),

      totalDuration: availability.totalDuration,
      totalPrice: availability.totalPrice,

      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return { success: true, bookingId: ref.id }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', err.message)
  }
})

exports.cancelBooking = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  await db.collection('bookings').doc(request.data.bookingId).update({
    status: 'cancelled'
  })

  return { success: true }
})

exports.rescheduleBooking = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const snap = await db.collection('bookings').doc(request.data.bookingId).get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Booking missing')
  }

  const booking = snap.data()
  const result = await findAvailableSlots(booking.serviceIds, {}, new Date(request.data.date))

  if (!result) {
    throw new HttpsError('already-exists', 'No slot')
  }

  await snap.ref.update({
    startAt: admin.firestore.Timestamp.fromDate(result.startAt),
    endAt: admin.firestore.Timestamp.fromDate(result.endAt),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

/* ---------------- STAFF (ADMIN) ---------------- */

exports.createStaff = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { name, services, isActive } = request.data
  if (!name || !Array.isArray(services) || !services.length) {
    throw new HttpsError('invalid-argument', 'Invalid staff data')
  }

  const ref = db.collection('staff').doc()
  await ref.set({
    name,
    services,
    userId: null,
    isAdmin: false,
    isActive: isActive !== false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, staffId: ref.id }
})

exports.updateStaff = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { staffId, ...rest } = request.data
  if (!staffId) {
    throw new HttpsError('invalid-argument', 'Staff ID required')
  }

  await db
    .collection('staff')
    .doc(staffId)
    .update({
      ...rest,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  return { success: true }
})

exports.toggleStaffStatus = onCall({ invoker: 'public' }, async (request) => {
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
exports.createService = onCall({ invoker: 'public' }, async (request) => {
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

exports.updateService = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { serviceId, ...rest } = request.data
  if (!serviceId) {
    throw new HttpsError('invalid-argument', 'Service ID required')
  }

  await db
    .collection('services')
    .doc(serviceId)
    .update({
      ...rest,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

  return { success: true }
})

exports.toggleServiceStatus = onCall({ invoker: 'public' }, async (request) => {
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

exports.linkStaffAccount = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const user = await admin.auth().getUser(request.auth.uid)
  const email = user.email
  if (!email) return { linked: false }

  const snap = await db.collection('staff').where('email', '==', email).limit(1).get()

  if (snap.empty) return { linked: false }

  const staffDoc = snap.docs[0]

  await staffDoc.ref.update({
    userId: request.auth.uid,
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  const existingClaims = user.customClaims || {}

  await admin.auth().setCustomUserClaims(request.auth.uid, {
    ...existingClaims,
    staff: true,
    admin: existingClaims.admin === true || staffDoc.data().isAdmin === true
  })

  return { linked: true }
})

exports.setStaffAdmin = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { staffId, isAdmin } = request.data
  const ref = db.collection('staff').doc(staffId)
  const snap = await ref.get()

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Staff not found')
  }

  const staff = snap.data()

  await ref.update({
    isAdmin,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  if (staff.userId) {
    const existing = (await admin.auth().getUser(staff.userId)).customClaims || {}

    await admin.auth().setCustomUserClaims(staff.userId, {
      ...existing,
      staff: true,
      admin: isAdmin
    })
  }

  return { success: true }
})
