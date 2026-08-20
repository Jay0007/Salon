import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth, onAuthStateChanged } from '@/services/firebase'
import { bootstrapSession } from '@/helpers/sessionBootstrap'
import { createPinia } from 'pinia'

const app = createApp(App)

let bootstrapped = false

onAuthStateChanged(auth, async (user) => {
  if (!user) return

  // Ensure token is fresh before app actions
  await user.getIdToken(true)

  bootstrapSession(user)
})
app.use(router)
app.use(createPinia())
app.mount('#app')
