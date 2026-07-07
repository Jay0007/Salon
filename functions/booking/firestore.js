const { db } = require('../firebaseAdmin')
const { normalizeToDate } = require('./dates')

async function loadServices(serviceIds) {
  const snaps = await Promise.all(serviceIds.map((id) => db.collection('services').doc(id).get()))

  const services = {}
  snaps.forEach((s, i) => {
    if (!s.exists) throw new Error(`Service not found: ${serviceIds[i]}`)
    services[serviceIds[i]] = {
      id: serviceIds[i],
      duration: Number(s.data().duration),
      price: Number(s.data().price)
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
    startAt: normalizeToDate(d.data().startAt),
    endAt: normalizeToDate(d.data().endAt)
  }))
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
      timezoneOffsetMinutes: 0
    }
  }

  const data = snap.data()

  return {
    ...data,
    openHour: Number(data.openHour),
    closeHour: Number(data.closeHour),
    timezoneOffsetMinutes: Number(data.timezoneOffsetMinutes)
  }
}

module.exports = {
  loadServices,
  loadStaff,
  loadCustomerBookings,
  getSalonSettings
}
