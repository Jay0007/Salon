import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth, onAuthStateChanged } from '@/services/firebase'
import { bootstrapSession } from '@/helpers/sessionBootstrap'

const app = createApp(App)

onAuthStateChanged(auth, (user) => {
  if (user) {
    bootstrapSession(user)
  }
})

app.use(router)
app.mount('#app')
