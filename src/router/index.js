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
import AdminAnalytics from '@/pages/admin/AdminAnalytics.vue'
import AdminCalendar from '@/pages/admin/AdminCalendar.vue'
/* --------------------------------------------------
   Routes
-------------------------------------------------- */

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
  },
  {
    path: '/admin/analytics',
    component: AdminAnalytics,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/calendar',
    component: AdminCalendar,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* --------------------------------------------------
   AUTH RESOLUTION (RUN ONCE)
-------------------------------------------------- */

let authResolved = false
let currentUser = null
onAuthStateChanged(auth, (user) => {
  currentUser = user
})
const getCurrentUser = () =>
  new Promise((resolve) => {
    if (authResolved) {
      return resolve(currentUser)
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authResolved = true
      currentUser = user
      unsubscribe()
      resolve(user)
    })
  })

/* --------------------------------------------------
   GLOBAL GUARD (FINAL)
-------------------------------------------------- */

router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser || currentUser || (await getCurrentUser())

  // 🔒 Requires login
  if (to.meta.requiresAuth && !user) {
    console.log('Access denied. Please log in first.')
    return next('/login')
  }

  // 🔁 Prevent logged-in users from visiting auth pages
  if ((to.path === '/login' || to.path === '/register') && user) {
    return next('/dashboard')
  }

  // 🔒 Admin-only routes
  if (to.meta.requiresAdmin) {
    if (!user) {
      return next('/login')
    }

    const token = await user.getIdTokenResult()
    if (!token.claims.admin) {
      return next('/dashboard')
    }
  }

  next()
})

export default router
