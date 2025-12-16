<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Header -->
    <h2 class="text-2xl font-semibold mb-6 text-gray-800">My Profile</h2>

    <!-- Profile Info -->
    <!-- Profile Info -->
    <section class="bg-white p-6 rounded-xl shadow-sm border mb-10">
      <div class="flex items-center gap-4 mb-6">
        <!-- Avatar -->
        <div
          class="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold"
        >
          {{ name.charAt(0) || 'U' }}
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-800">Personal Information</h3>
          <p class="text-sm text-gray-500">
            Keep your details updated for smooth booking & communication
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"> Full Name </label>
          <input
            v-model="name"
            class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Enter your name"
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"> Phone Number </label>

          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              +91
            </span>
            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              class="w-full border rounded-lg pl-12 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="XXXXXXXXXX"
            />
          </div>

          <p v-if="!isPhoneValid && phone" class="text-xs text-red-500 mt-1">
            Please enter a valid 10-digit phone number
          </p>

          <p v-else class="text-xs text-gray-400 mt-1">
            Used for appointment updates & confirmations
          </p>
        </div>
      </div>

      <!-- Save Button -->
      <div class="mt-6 flex justify-end">
        <BaseButton :disabled="!canSave" class="px-6" @click="saveChanges">
          Save Changes
        </BaseButton>
      </div>
    </section>

    <!-- Tabs -->
    <div class="flex gap-4 mb-4">
      <button @click="tab = 'upcoming'" :class="tab === 'upcoming' ? activeTab : inactiveTab">
        Upcoming Appointments
      </button>
      <button @click="tab = 'past'" :class="tab === 'past' ? activeTab : inactiveTab">
        Past Appointments
      </button>
    </div>

    <!-- Appointments List -->
    <div v-if="tab === 'upcoming'" class="space-y-4">
      <div v-for="item in upcoming" :key="item.id" class="bg-gray-50 border rounded-lg p-5">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">
            {{ formatDate(item.datetime) }}
          </p>

          <span class="text-xs px-3 py-1 rounded-full bg-green-200 text-gray-700"> Pending </span>
        </div>

        <!-- Services -->
        <div class="mt-3 space-y-2">
          <div
            v-for="service in item.services"
            :key="service.serviceId"
            class="flex justify-between text-sm bg-white p-3 rounded border"
          >
            <span class="font-medium text-gray-800">{{ service.name }}</span>
            <span class="text-gray-500"> ₹{{ service.price }} · {{ service.duration }} min </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-3 border-t flex justify-between text-sm">
          <span class="text-gray-600">Total</span>
          <span class="font-semibold text-gray-800">
            ₹{{ item.totalPrice }} · {{ item.totalDuration }} min
          </span>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div v-for="item in past" :key="item.id" class="bg-gray-50 border rounded-lg p-5">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">
            {{ formatDate(item.datetime) }}
          </p>

          <span class="text-xs px-3 py-1 rounded-full bg-red-200 text-gray-700"> Completed </span>
        </div>

        <!-- Services -->
        <div class="mt-3 space-y-2">
          <div
            v-for="service in item.services"
            :key="service.serviceId"
            class="flex justify-between text-sm bg-white p-3 rounded border"
          >
            <span class="font-medium text-gray-800">{{ service.name }}</span>
            <span class="text-gray-500"> ₹{{ service.price }} · {{ service.duration }} min </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-3 border-t flex justify-between text-sm">
          <span class="text-gray-600">Total</span>
          <span class="font-semibold text-gray-800">
            ₹{{ item.totalPrice }} · {{ item.totalDuration }} min
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  auth,
  updateProfile,
  getDocs,
  query,
  where,
  collection,
  db,
  updateDoc,
  doc,
  cancelBooking
} from '@/services/firebase'
import BaseButton from '@/components/BaseButton.vue'
import { computed } from 'vue'

const name = ref('')
const phone = ref('')
const tab = ref('upcoming')
const upcoming = ref([])
const past = ref([])

const user = auth.currentUser

onMounted(async () => {
  if (user) {
    name.value = user.displayName || ''
    await loadBookings()
  }
})
const isPhoneValid = computed(() => {
  if (!phone.value) return false
  return /^\d{10}$/.test(phone.value)
})

const canSave = computed(() => {
  return name.value.trim().length >= 2 && isPhoneValid.value
})

async function saveChanges() {
  if (!user) return

  if (!canSave.value) {
    alert('Please enter a valid name and phone number.')
    return
  }

  await updateProfile(user, {
    displayName: name.value.trim()
  })

  const userRef = doc(db, 'users', user.uid)
  await updateDoc(userRef, {
    fullName: name.value.trim(),
    phone: `+91${phone.value}`
  })

  alert('Profile updated successfully!')
}

async function loadBookings() {
  const now = new Date().getTime()
  const q = query(collection(db, 'bookings'), where('userId', '==', user.uid))
  const snapshot = await getDocs(q)
  snapshot.forEach((docSnap) => {
    const data = { id: docSnap.id, ...docSnap.data() }
    // console.log(new Date(data.datetime).getTime())
    // console.log(now)
    if (new Date(data.datetime).getTime() >= now) upcoming.value.push(data)
    else past.value.push(data)
  })
  console.log(past)
}

async function cancel(id) {
  await cancelBooking(id)
  upcoming.value = upcoming.value.filter((item) => item.id !== id)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const activeTab = 'text-indigo-600 border-b-2 border-indigo-600 pb-1'
const inactiveTab = 'text-gray-500 hover:text-indigo-600 pb-1'
</script>
