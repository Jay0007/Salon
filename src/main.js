import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth } from './services/firebase'
import { onAuthStateChanged } from 'firebase/auth'

let app // we’ll mount this exactly once

onAuthStateChanged(auth, (user) => {
  // you could provide `user` to your app here via provide/inject or a store
  if (!app) {
    app = createApp(App)
      .use(router)
      .provide('currentUser', user) // optional: inject into any component
      .mount('#app')
  }
})
