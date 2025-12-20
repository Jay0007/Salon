<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Booking Section -->
    <div class="max-w-4xl mx-auto py-12 px-4">
      <h1 class="text-3xl font-semibold text-gray-800 mb-6">Book a Service</h1>

      <div class="flex flex-col lg:flex-row gap-6 mt-6 max-w-7xl mx-auto px-4">
        <!-- Left: Steps & Forms -->
        <div class="w-full lg:w-2/3 space-y-4">
          <!-- Step Tracker -->
          <!-- Step Progress Bar -->
          <div class="flex items-center justify-between mb-6">
            <div v-for="(label, index) in steps" :key="index" class="flex items-center w-full">
              <div
                class="relative flex items-center justify-center w-8 h-8 rounded-full"
                :class="[
                  step > index + 1
                    ? 'bg-green-500 text-white'
                    : step === index + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                ]"
              >
                {{ index + 1 }}
              </div>
              <div
                class="ml-2 text-sm font-medium"
                :class="step === index + 1 ? 'text-indigo-700' : 'text-gray-500'"
              >
                {{ label }}
              </div>
              <div v-if="index < steps.length - 1" class="flex-1 h-0.5 bg-gray-300 mx-2"></div>
            </div>
          </div>

          <!-- Step Component -->
          <div class="bg-white p-6 shadow rounded-lg border">
            <StepBookingFor v-if="step === 1" v-model="bookingFor" />
            <StepServices v-if="step === 2" v-model="selectedServices" />
            <StepSchedule v-if="step === 3" v-model="booking" :duration="totalTime" />

            <!-- Step Controls -->
            <div class="mt-6 flex justify-between">
              <button
                @click="step--"
                v-if="step > 1"
                class="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Back
              </button>

              <div class="flex-1"></div>

              <button
                v-if="step < 3"
                @click="goToNextStep"
                :disabled="!canProceed || !isBookingForValid"
                class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Cart Summary -->
        <div class="w-full lg:w-1/3">
          <div class="sticky top-24 bg-white border p-4 shadow rounded-lg">
            <h3 class="pb-4 text-lg font-semibold text-indigo-700">Your Booking</h3>
            <p class="text-sm text-gray-500 mt-1">Salon: Glamour Touch, North York</p>

            <div class="mt-4">
              <h4 class="font-medium mb-2">Selected Services:</h4>
              <ul v-if="selectedServices.length">
                <li
                  v-for="(s, i) in selectedServices"
                  :key="i"
                  class="flex justify-between text-sm text-gray-700 mb-1"
                >
                  <span>{{ s.name }}</span>
                  <span>${{ s.price }}</span>
                </li>
              </ul>
              <p v-else class="text-sm text-gray-400">No services selected.</p>
            </div>

            <div class="mt-4 pt-4 border-t">
              <div class="flex justify-between text-sm font-medium">
                <span>Total</span>
                <span>${{ totalPrice }}</span>
              </div>
              <div class="flex justify-between text-sm text-gray-500 mt-1">
                <span>Estimated time</span>
                <span>{{ totalTime }} min</span>
              </div>
            </div>

            <div class="mt-6 flex justify-between">
              <button
                v-if="step === 3"
                @click="confirmBooking"
                class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import StepBookingFor from '@/components/StepBookingFor.vue'
import StepServices from '@/components/StepServices.vue'
import { useRouter } from 'vue-router'

import {
  db,
  auth,
  onAuthStateChanged,
  collection,
  addBooking,
  serverTimestamp
} from '../services/firebase'
import StepSchedule from '@/components/StepSchedule.vue'
const user = ref(null)
const router = useRouter()

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (!currentUser) {
      router.push('/login')
    } else {
      bookingFor.value.name = currentUser.displayName || 'Guest User'
    }
    user.value = currentUser
  })
})

const steps = ['Who is this for?', 'Select Services', 'Date & Time']

const selectedServices = ref([])
const booking = ref({
  date: null,
  startTime: null,
  endTime: null
})
const step = ref(1)

const bookingFor = ref({
  type: 'self',
  name: '',
  phone: ''
})

const totalPrice = computed(() => selectedServices.value.reduce((sum, s) => sum + s.price, 0))

const totalTime = computed(() => selectedServices.value.reduce((sum, s) => sum + s.duration, 0))

// Enable "Next" button conditionally
const canProceed = computed(() => {
  if (step.value === 1) {
    return bookingFor.value.type
  }

  if (step.value === 2) return selectedServices.value.length > 0
  return true
})

const isBookingForValid = computed(() => {
  if (bookingFor.value.type === 'self') return true

  const name = bookingFor.value.name.trim()
  const phoneDigits = bookingFor.value.phone.replace(/\D/g, '')

  const isValidName = /^[A-Za-z\s]{3,15}$/.test(name)
  const isValidPhone = phoneDigits.length == 10

  return isValidName && isValidPhone
})

function goToNextStep() {
  if (step.value < 3) step.value++
}

const confirmBooking = async () => {
  if (!user.value) {
    alert('Please login first.')
    return
  }

  if (!booking.value.date || !booking.value.startTime) {
    alert('Please select date and time')
    return
  }
  const bookingData = {
    userId: user.value.uid,
    datetime: booking.value.startTime,
    bookingFor: {
      type: bookingFor.value.type,
      name: bookingFor.value.name.trim()
      // phone: bookingFor.value.phone
    },
    services: selectedServices.value.map((s) => ({
      serviceId: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration,
      category: s.category
    })),
    totalPrice: totalPrice.value,
    totalDuration: totalTime.value,
    status: 'pending_confirmation',
    createdAt: serverTimestamp()
  }
  try {
    await addBooking(bookingData)
    router.push('/profile')
  } catch (err) {
    console.error(err)
    alert('Failed to create booking.')
  }
}
</script>
