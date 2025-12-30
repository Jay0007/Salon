// functions/index.js
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { admin, db } = require('./firebaseAdmin')
const { findEarliestSlot } = require('./bookingEngine')

function assertAuth(ctx) {
  if (!ctx.auth) throw new HttpsError('unauthenticated', 'Login required')
}

function assertAdmin(ctx) {
  if (!ctx.auth || ctx.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only')
  }
}

exports.getAvailableDates = onCall({ invoker: 'public' }, async (data, ctx) => {
  assertAuth(ctx)

  const { serviceIds } = data
  if (!serviceIds?.length) return []

  const dates = []
  const today = new Date()

  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)

    const result = await findEarliestSlot(serviceIds, {}, d)
    if (result) dates.push(d.toISOString().split('T')[0])
  }

  return dates
})

exports.getAvailableSlots = onCall({ invoker: 'public' }, async (data, ctx) => {
  assertAuth(ctx)

  const { serviceIds, date } = data
  const slots = []

  const base = new Date(date)
  const result = await findEarliestSlot(serviceIds, {}, base)

  if (!result) return []

  slots.push({
    startAt: result.startAt,
    endAt: result.endAt
  })

  return slots
})

/* ---------------- BOOKINGS ---------------- */

exports.createBooking = onCall({ invoker: 'public' }, async (data, ctx) => {
  assertAuth(ctx)

  const { serviceIds, date } = data
  const result = await findEarliestSlot(serviceIds, {}, new Date(date))

  if (!result) throw new HttpsError('already-exists', 'No slot')

  const ref = db.collection('bookings').doc()
  await ref.set({
    userId: ctx.auth.uid,
    serviceIds,
    staffAssignments: result.staffAssignments,
    startAt: admin.firestore.Timestamp.fromDate(result.startAt),
    endAt: admin.firestore.Timestamp.fromDate(result.endAt),
    totalDuration: result.totalDuration,
    totalPrice: result.totalPrice,
    status: 'confirmed',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, bookingId: ref.id }
})

exports.cancelBooking = onCall({ invoker: 'public' }, async (data, ctx) => {
  assertAuth(ctx)
  await db.collection('bookings').doc(data.bookingId).update({
    status: 'cancelled'
  })
  return { success: true }
})

exports.rescheduleBooking = onCall({ invoker: 'public' }, async (data, ctx) => {
  assertAuth(ctx)

  const snap = await db.collection('bookings').doc(data.bookingId).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Booking missing')

  const booking = snap.data()
  const result = await findEarliestSlot(booking.serviceIds, {}, new Date(data.date))

  if (!result) throw new HttpsError('already-exists', 'No slot')

  await snap.ref.update({
    startAt: admin.firestore.Timestamp.fromDate(result.startAt),
    endAt: admin.firestore.Timestamp.fromDate(result.endAt),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

// staff admin
exports.createStaff = onCall({ invoker: 'public' }, async (data, context) => {
  assertAdmin(context)

  const { name, services, isActive } = data
  if (!name || !Array.isArray(services) || !services.length) {
    throw new HttpsError('invalid-argument', 'Invalid staff data')
  }

  const ref = db.collection('staff').doc()
  await ref.set({
    name,
    email,
    services,
    userId: null,
    isAdmin: false,
    isActive: isActive !== false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, staffId: ref.id }
})

exports.updateStaff = onCall({ invoker: 'public' }, async (data, context) => {
  assertAdmin(context)

  const { staffId, ...rest } = data
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

exports.toggleStaffStatus = onCall({ invoker: 'public' }, async (data, context) => {
  assertAdmin(context)

  const { staffId, isActive } = data
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

exports.createService = onCall({ invoker: 'public' }, async (data, context) => {
  assertAdmin(context)

  const { name, category, price, duration } = data
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

exports.updateService = onCall({ invoker: 'public' }, async (data, context) => {
  assertAdmin(context)

  const { serviceId, ...rest } = data
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

exports.toggleServiceStatus = onCall({ invoker: 'public' }, async (data, context) => {
  assertAdmin(context)

  const { serviceId, isActive } = data
  if (!serviceId) {
    throw new HttpsError('invalid-argument', 'Service ID required')
  }

  await db.collection('services').doc(serviceId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

// Staff admin
exports.linkStaffAccount = onCall({ invoker: 'public' }, async (_, ctx) => {
  assertAuth(ctx)

  const user = await admin.auth().getUser(ctx.auth.uid)
  const email = user.email

  const snap = await db.collection('staff').where('email', '==', email).limit(1).get()

  if (snap.empty) return { linked: false }

  const staffDoc = snap.docs[0]

  await staffDoc.ref.update({
    userId: ctx.auth.uid,
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  const existingClaims = user.customClaims || {}

  await admin.auth().setCustomUserClaims(ctx.auth.uid, {
    ...existingClaims,
    staff: true,
    admin: existingClaims.admin === true || staffDoc.data().isAdmin === true
  })

  return { linked: true }
})

exports.setStaffAdmin = onCall({ invoker: 'public' }, async (data, ctx) => {
  assertAdmin(ctx)

  const { staffId, isAdmin } = data
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
