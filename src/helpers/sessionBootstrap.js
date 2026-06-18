import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

let initialized = false

export async function bootstrapSession(user) {
  if (!user || initialized) return
  initialized = true

  // try {
  //   // IMPORTANT: must be invoked
  //   await httpsCallable(functions, 'linkStaffAccount')()
  // } catch {
  //   // ignore — non-staff users
  // }

  // Refresh token ONCE to pull updated claims
  await user.getIdToken(true)
}
