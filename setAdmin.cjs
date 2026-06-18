const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const uid = 'e5S8Bp8DZaWRs7rvjO5hPWSYEu43' // YOUR UID

admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Admin claim set')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
