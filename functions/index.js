// functions/index.js
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { admin, db } = require('./firebaseAdmin')
const DEBUG = false
const {
  findAvailableTimelines,
  validateTimeline,
  blockStaffCalendarPerSegment,
  unblockStaffCalendarPerSegment,
  calculateStaffUtilization,
  getSalonSettings,
  normalizeToDate
} = require('./bookingEngine')

/* ======================================================
   AUTH HELPERS
====================================================== */

function assertAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }
}

function assertAdmin(request) {
  assertAuth(request)
  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only')
  }
}

/* ======================================================
   PUBLIC – FIND AVAILABLE TIMELINES
====================================================== */

exports.findAvailableTimelines = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)
  if (DEBUG) {
    console.log('index.js - Request data:', request.data)
  }
  const { date, serviceIds, preferredStaffMap = {} } = request.data || {}

  if (!date || !Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Invalid payload')
  }

  return await findAvailableTimelines({
    date,
    serviceIds,
    preferredStaffMap,
    userId: request.auth.uid
  })
})

/* ======================================================
   PUBLIC – CREATE BOOKING (TIMELINE)
====================================================== */

exports.createBooking = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const { timeline, bookingFor } = request.data || {}
  if (DEBUG) {
    console.log('index.js - Create booking request:', request.data)
  }
  if (
    !timeline ||
    !timeline.startAt ||
    !timeline.endAt ||
    !Array.isArray(timeline.segments) ||
    timeline.segments.length === 0
  ) {
    throw new HttpsError('invalid-argument', 'Invalid timeline')
  }

  // 🔐 Validate timeline one last time (race-condition safe)
  const validation = await validateTimeline(timeline, request.auth.uid)
  if (!validation.valid) {
    throw new HttpsError('already-exists', validation.reason)
  }

  const bookingRef = db.collection('bookings').doc()

  await db.runTransaction(async (tx) => {
    tx.set(bookingRef, {
      userId: request.auth.uid,
      bookingFor: bookingFor || null,
      segments: timeline.segments,
      startAt: timeline.startAt,
      endAt: timeline.endAt,
      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })

  // 🚫 Block staff calendars (once per segment)
  await blockStaffCalendarPerSegment(timeline.segments)

  return { success: true, bookingId: bookingRef.id }
})

/* ======================================================
   PUBLIC – CANCEL BOOKING
====================================================== */

exports.cancelBooking = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const { bookingId } = request.data || {}
  if (!bookingId) {
    throw new HttpsError('invalid-argument', 'Booking ID required')
  }

  const ref = db.collection('bookings').doc(bookingId)
  const snap = await ref.get()

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Booking not found')
  }

  const booking = snap.data()

  if (booking.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Not your booking')
  }

  if (booking.status === 'cancelled') {
    return { success: true }
  }

  // 🔓 Unblock staff calendars
  await unblockStaffCalendarPerSegment(booking.segments || [])

  await ref.update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

/* ======================================================
   PUBLIC – RESCHEDULE BOOKING (TIMELINE)
====================================================== */

exports.rescheduleBooking = onCall({ invoker: 'public' }, async (request) => {
  assertAuth(request)

  const { bookingId, newTimeline } = request.data || {}

  if (DEBUG) {
    console.log('index.js - Reschedule booking request:', request.data)
  }

  if (
    !bookingId ||
    !newTimeline ||
    !Array.isArray(newTimeline.segments) ||
    newTimeline.segments.length === 0
  ) {
    throw new HttpsError('invalid-argument', 'Invalid reschedule payload')
  }

  const ref = db.collection('bookings').doc(bookingId)
  const snap = await ref.get()
  if (DEBUG) {
    console.log('index.js - Booking snapshot:', snap.exists, snap.data())
  }
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Booking not found')
  }

  const booking = snap.data()

  if (booking.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Not your booking')
  }
  // await unblockStaffCalendarPerSegment(booking.segments || [])

  // 🔐 Validate new timeline
  const validation = await validateTimeline(newTimeline, request.auth.uid)
  if (!validation.valid) {
    throw new HttpsError('already-exists', validation.reason)
  }

  // 🔓 Unblock old segments
  await unblockStaffCalendarPerSegment(booking.segments || [])

  // 🚫 Block new segments
  await blockStaffCalendarPerSegment(newTimeline.segments)
  if (DEBUG) {
    console.log('index.js - New timeline:', newTimeline)
  }
  await ref.update({
    segments: newTimeline.segments,
    startAt: admin.firestore.Timestamp.fromDate(new Date(newTimeline.startAt)),
    endAt: admin.firestore.Timestamp.fromDate(new Date(newTimeline.endAt)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

/* ======================================================
   ADMIN – STAFF UTILIZATION
====================================================== */

exports.getStaffUtilization = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { staffId, date } = request.data || {}
  if (!staffId || !date) {
    throw new HttpsError('invalid-argument', 'staffId and date required')
  }
  if (DEBUG) {
    console.log('index.js - getStaffUtilization request:', request.data)
  }
  const salon = await getSalonSettings()

  const openAt = new Date(date)
  openAt.setHours(salon.openHour, 0, 0, 0)

  const closeAt = new Date(date)
  closeAt.setHours(salon.closeHour, 0, 0, 0)
  if (DEBUG) {
    console.log('index.js - openAt:', openAt, 'closeAt:', closeAt)
  }
  const key = `${staffId}_${date.slice(0, 10)}`
  const snap = await db.collection('staffCalendars').doc(key).get()

  const blocked = snap.exists
    ? snap.data().blocked.map((b) => ({
        startAt: normalizeToDate(b.startAt),
        endAt: normalizeToDate(b.endAt)
      }))
    : []

  const freeIntervals = []
  let cursor = openAt
  if (DEBUG) {
    console.log('index.js - blocked intervals:', blocked)
  }
  for (const b of blocked.sort((a, b) => a.startAt - b.startAt)) {
    if (cursor < b.startAt) freeIntervals.push({ startAt: cursor, endAt: b.startAt })
    cursor = new Date(Math.max(cursor, b.endAt))
  }
  if (cursor < closeAt) freeIntervals.push({ startAt: cursor, endAt: closeAt })

  return calculateStaffUtilization(freeIntervals, openAt, closeAt)
})

// public

exports.getStaffForBooking = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Auth required')
  }

  const snap = await db.collection('staff').where('isActive', '==', true).get()
  if (DEBUG) {
    console.log(
      'index.js - getStaffForBooking snapshot:',
      snap.docs.map((d) => d.data())
    )
  }
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    services: d.data().services || []
  }))
})

exports.getBookingLookups = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Auth required')
  }
  if (DEBUG) {
    console.log('index.js - getBookingLookups request:', request.data)
  }
  const [servicesSnap, staffSnap] = await Promise.all([
    db.collection('services').get(),
    db.collection('staff').get()
  ])

  const services = {}
  servicesSnap.forEach((d) => {
    services[d.id] = {
      name: d.data().name,
      duration: d.data().duration,
      price: d.data().price
    }
  })
  if (DEBUG) {
    console.log('index.js - services:', services)
  }
  const staff = {}
  staffSnap.forEach((d) => {
    staff[d.id] = {
      name: d.data().name
    }
  })

  return { services, staff }
})

exports.getMyBookings = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Auth required')
  }

  const snap = await db.collection('bookings').where('userId', '==', request.auth.uid).get()
  if (DEBUG) {
    console.log(
      'index.js - getMyBookings snapshot:',
      snap.docs.map((d) => d.data())
    )
  }
  return snap.docs.map((d) => {
    const data = d.data()
    const start = normalizeToDate(data.startAt)
    const end = normalizeToDate(data.endAt)

    return {
      id: d.id,
      ...data,
      startAt: start ? start.toISOString() : null,
      endAt: end ? end.toISOString() : null
    }
  })
})

/* ======================================================
   ADMIN – SERVICES
====================================================== */

exports.createService = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { name, category, price, duration } = request.data || {}
  if (!name || !category || !price || !duration) {
    throw new HttpsError('invalid-argument', 'Invalid service data')
  }
  if (DEBUG) {
    console.log('index.js - createService request:', request.data)
  }
  const ref = await db.collection('services').add({
    name,
    category,
    price,
    duration,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { id: ref.id }
})

exports.updateService = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { serviceId, ...updates } = request.data || {}
  if (!serviceId) {
    throw new HttpsError('invalid-argument', 'Service ID required')
  }

  await db
    .collection('services')
    .doc(serviceId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

  return { success: true }
})

exports.toggleServiceStatus = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { serviceId, isActive } = request.data || {}
  if (!serviceId || typeof isActive !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Invalid payload')
  }

  await db.collection('services').doc(serviceId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

/* ======================================================
   ADMIN – STAFF
====================================================== */

exports.createStaff = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { name, services = [] } = request.data || {}
  if (!name || !Array.isArray(services)) {
    throw new HttpsError('invalid-argument', 'Invalid staff data')
  }

  const ref = await db.collection('staff').add({
    name,
    services,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { id: ref.id }
})

exports.updateStaff = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { staffId, ...updates } = request.data || {}
  if (!staffId) {
    throw new HttpsError('invalid-argument', 'Staff ID required')
  }

  await db
    .collection('staff')
    .doc(staffId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

  return { success: true }
})

exports.toggleStaffStatus = onCall({ invoker: 'public' }, async (request) => {
  assertAdmin(request)

  const { staffId, isActive } = request.data || {}
  if (!staffId || typeof isActive !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Invalid payload')
  }

  await db.collection('staff').doc(staffId).update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true }
})

// ADMIN - SALON analytics

exports.getStaffAdmin = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only')
  }

  const snap = await db.collection('staff').where('isActive', '==', true).get()

  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    services: d.data().services || []
  }))
})

exports.getStaffCalendarAdmin = onCall({ invoker: 'public' }, async (request) => {
  // must be admin
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only')
  }
  if (DEBUG) {
    console.log('index.js - getStaffCalendarAdmin request:', request.data)
  }
  const { staffId, date } = request.data || {}
  if (!staffId || !date) {
    throw new HttpsError('invalid-argument', 'staffId and date required')
  }
  if (DEBUG) {
    console.log('index.js - getStaffCalendarAdmin request:', request.data)
  }
  const docId = `${staffId}_${date}`
  const snap = await db.collection('staffCalendars').doc(docId).get()

  const blocked = snap.exists ? snap.data().blocked || [] : []
  if (DEBUG) {
    console.log('index.js - getStaffCalendarAdmin blocked intervals:', blocked)
  }
  return blocked.map((b) => ({
    startAt: normalizeToDate(b.startAt)?.toISOString(),
    endAt: normalizeToDate(b.endAt)?.toISOString()
  }))
})

// User form submission

exports.submitContactForm = onCall(async (request) => {

    const {
        fullName,
        email,
        phone,
        service,
        message
    } = request.data;

    if (!fullName?.trim())
        throw new HttpsError("invalid-argument", "Name is required.");

    if (!email?.trim())
        throw new HttpsError("invalid-argument", "Email is required.");

    if (!message?.trim())
        throw new HttpsError("invalid-argument", "Message is required.");

    if (message.length > 2000)
        throw new HttpsError("invalid-argument", "Message is too long.");

    const now = admin.firestore.FieldValue.serverTimestamp();

    const doc = {

        fullName: fullName.trim(),

        email: email.trim().toLowerCase(),

        phone: phone?.trim() || "",

        service: service || "",

        message: message.trim(),

        status: "new",

        createdAt: now,

        updatedAt: now

    };

    const ref = await admin
        .firestore()
        .collection("contactMessages")
        .add(doc);

    return {

        success: true,

        id: ref.id

    };

});

//Admin - Salon settings

exports.makeAdmin = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required')
  }

  await admin.auth().setCustomUserClaims(request.auth.uid, {
    admin: true,
    staff: true
  })

  return { success: true }
})
