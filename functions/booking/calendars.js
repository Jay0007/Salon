const { db, admin } = require('../firebaseAdmin')
const { normalizeToDate } = require('./dates')

const DEBUG = false

/* ======================================================
   STAFF CALENDAR BLOCK / UNBLOCK
====================================================== */

async function blockStaffCalendarPerSegment(segments) {
  for (const seg of segments) {
    const d = normalizeToDate(seg.startAt)
    const dateKey = d.toISOString().slice(0, 10)
    const ref = db.collection('staffCalendars').doc(`${seg.staffId}_${dateKey}`)

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const blocked = snap.exists ? snap.data().blocked || [] : []

      blocked.push({ startAt: seg.startAt, endAt: seg.endAt })

      tx.set(
        ref,
        {
          staffId: seg.staffId,
          date: dateKey,
          blocked,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      )
    })
  }
}

async function unblockStaffCalendarPerSegment(segments) {
  for (const seg of segments) {
    const d = normalizeToDate(seg.startAt)
    const dateKey = d.toISOString().slice(0, 10)
    const ref = db.collection('staffCalendars').doc(`${seg.staffId}_${dateKey}`)

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return

      const blocked = (snap.data().blocked || []).filter(
        (b) => !(b.startAt === seg.startAt && b.endAt === seg.endAt)
      )

      tx.set(ref, { blocked }, { merge: true })
    })
  }
}

/* ======================================================
   STAFF CALENDARS
====================================================== */

async function getStaffBlockedIntervals(staffId, dateInput) {
  const d = normalizeToDate(dateInput)
  if (!d) return []

  const dateKey = d.toISOString().slice(0, 10)

  const docId = `${staffId}_${dateKey}`
  const snap = await db.collection('staffCalendars').doc(docId).get()
  if (DEBUG) {
    console.log({
      dateInput,
      dateKey
    })
  }
  if (!snap.exists) return []

  return snap.data().blocked.map((b) => ({
    startAt: normalizeToDate(b.startAt),
    endAt: normalizeToDate(b.endAt)
  }))
}
module.exports = {
  blockStaffCalendarPerSegment,
  unblockStaffCalendarPerSegment,
  getStaffBlockedIntervals
}
