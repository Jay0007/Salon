import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import ServicesPage from '../views/ServicesPage.vue'
import AboutPage from '../views/AboutPage.vue'
import ContactPage from '../views/ContactPage.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ClientDashboard from '../views/ClientDashboard.vue'
import UserProfile from '@/views/UserProfile.vue'
import manageServices from '@/pages/admin/manageServices.vue'
import { auth } from '../services/firebase'

const routes = [
  { path: '/', component: HomePage },
  { path: '/services', component: ServicesPage },
  { path: '/about', component: AboutPage },
  { path: '/contact', component: ContactPage },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: ClientDashboard, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: UserProfile, meta: { requiresAuth: true } },
  {
    path: '/admin/manageservices',
    name: 'manageServices',
    component: manageServices,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = !!auth.currentUser // after onAuthStateChanged runs

  if (requiresAuth && !isAuthenticated) {
    return next('/login')
  }
  if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    return next('/dashboard')
  }
  next()
})

export default router
