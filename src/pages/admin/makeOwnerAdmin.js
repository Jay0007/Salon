// admin-scripts/makeOwnerAdmin.js
import admin from 'firebase-admin'
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' }

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

async function makeOwnerAdmin() {
  const OWNER_UID = 'e5S8Bp8DZaWRs7rvjO5hPWSYEu43'

  await admin.auth().setCustomUserClaims(OWNER_UID, {
    admin: true,
    staff: true
  })

  console.log('Owner account is now permanent admin')
  process.exit(0)
}

makeOwnerAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})
