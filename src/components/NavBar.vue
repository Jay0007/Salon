<template>
  <!-- Main Navbar -->
  <nav class="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
    <div class="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
      <router-link
        to="/"
        class="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition"
      >
        MySalon
      </router-link>

      <!-- Desktop Nav Links -->
      <ul class="hidden md:flex items-center space-x-6">
        <li><router-link to="/" class="nav-link">Home</router-link></li>
        <li><router-link to="/services" class="nav-link">Services</router-link></li>
        <li><router-link to="/about" class="nav-link">About</router-link></li>
        <li><router-link to="/contact" class="nav-link">Contact</router-link></li>

        <li v-if="isLoggedIn" class="relative group">
          <button class="nav-link flex items-center gap-1">Account <span>▾</span></button>
          <ul
            class="absolute top-full mt-2 w-40 right-0 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
          >
            <li><router-link to="/dashboard" class="dropdown-link">Dashboard</router-link></li>
            <li><router-link to="/profile" class="dropdown-link">My Bookings</router-link></li>
            <li><button @click="logout" class="dropdown-link text-red-500">Logout</button></li>
          </ul>
        </li>
        <li v-if="isLoggedIn" class="relative group">
          <button class="nav-link flex items-center gap-1">Admin <span>▾</span></button>
          <ul
            class="absolute top-full mt-2 w-40 right-0 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
          >
            <li>
              <router-link to="/admin/manageservices" class="dropdown-link"
                >Manage Services</router-link
              >
            </li>
            <li>
              <router-link to="/admin/managestaff" class="dropdown-link">Manage Staff</router-link>
            </li>
          </ul>
        </li>

        <li v-if="!isLoggedIn">
          <router-link to="/login" class="nav-link">Login</router-link>
        </li>
        <li v-if="!isLoggedIn">
          <router-link to="/register" class="nav-link">Register</router-link>
        </li>
      </ul>

      <!-- Mobile Toggle -->
      <button class="md:hidden text-gray-700" @click="open = !open">
        <svg v-if="!open" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Mobile Drawer -->
    <transition name="fade">
      <div v-if="open" class="md:hidden bg-white shadow-lg border-t">
        <ul class="px-6 py-4 space-y-3">
          <li><router-link to="/" @click="close" class="mobile-link">Home</router-link></li>
          <li>
            <router-link to="/services" @click="close" class="mobile-link">Services</router-link>
          </li>
          <li><router-link to="/about" @click="close" class="mobile-link">About</router-link></li>
          <li>
            <router-link to="/contact" @click="close" class="mobile-link">Contact</router-link>
          </li>

          <template v-if="isLoggedIn">
            <li>
              <router-link to="/dashboard" @click="close" class="mobile-link"
                >Dashboard</router-link
              >
            </li>
            <li>
              <router-link to="/profile" @click="close" class="mobile-link"
                >My Bookings</router-link
              >
            </li>
            <li>
              <button class="mobile-link">Admin <span>▾</span></button>
              <ul
                class="absolute top-full mt-2 w-40 right-0 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
              >
                <li>
                  <router-link to="/admin/manageservices" class="dropdown-link"
                    >Manage Services</router-link
                  >
                </li>
                <li>
                  <router-link to="/admin/managestaff" class="dropdown-link"
                    >Manage Staff</router-link
                  >
                </li>
              </ul>
            </li>
            <li>
              <button @click="(logout(), close())" class="mobile-link text-red-500">Logout</button>
            </li>
          </template>

          <template v-else>
            <li><router-link to="/login" @click="close" class="mobile-link">Login</router-link></li>
            <li>
              <router-link to="/register" @click="close" class="mobile-link">Register</router-link>
            </li>
          </template>
        </ul>
      </div>
    </transition>
  </nav>

  <!-- Optional tagline below nav -->
  <div class="mt-16 bg-indigo-50 text-center py-2 text-sm text-indigo-700 hidden sm:block">
    Professional beauty services, tailored for you.
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, onAuthStateChanged, signOut } from '../services/firebase'
import { useRouter } from 'vue-router'

const open = ref(false)
const isLoggedIn = ref(false)
const router = useRouter()

onMounted(() => {
  onAuthStateChanged(auth, (user) => (isLoggedIn.value = !!user))
})

const logout = async () => {
  await signOut(auth)
  router.push('/login')
}

const close = () => (open.value = false)
</script>

<style scoped>
@reference "tailwindcss";

.nav-link {
  @apply text-gray-700 hover:text-indigo-600 font-medium transition;
}
.dropdown-link {
  @apply block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition w-full text-left;
}
.mobile-link {
  @apply block text-gray-700 hover:text-indigo-600 font-medium transition;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
