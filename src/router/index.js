import { createRouter, createWebHistory } from 'vue-router'
import { auth, onAuthStateChanged } from '@/services/firebase'

import HomePage from '@/views/HomePage.vue'
import ServicesPage from '@/views/ServicesPage.vue'
import AboutPage from '@/views/AboutPage.vue'
import ContactPage from '@/views/ContactPage.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ClientDashboard from '@/views/ClientDashboard.vue'
import UserProfile from '@/views/UserProfile.vue'
import ManageServices from '@/pages/admin/manageServices.vue'
import ManageStaff from '@/pages/admin/manageStaff.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/services', component: ServicesPage },
  { path: '/about', component: AboutPage },
  { path: '/contact', component: ContactPage },

  { path: '/login', component: Login },
  { path: '/register', component: Register },

  {
    path: '/dashboard',
    component: ClientDashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    component: UserProfile,
    meta: { requiresAuth: true }
  },

  {
    path: '/admin/manageservices',
    component: ManageServices,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/managestaff',
    component: ManageStaff,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ---- AUTH RESOLUTION HELPER ----
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(user)
    })
  })
}

// ---- GLOBAL GUARD ----
router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser

  if (to.meta.requiresAuth && !user) {
    return next('/login')
  }

  if (to.meta.requiresAdmin && user) {
    const token = await user.getIdTokenResult()
    if (!token.claims.admin) {
      return next('/dashboard')
    }
  }

  next()
})

export default router
