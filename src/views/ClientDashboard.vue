<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto py-12 px-4">
      <!-- Header -->
      <div class="mb-10 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold tracking-tight text-gray-900">Book Appointment</h1>

          <p class="mt-2 text-gray-500">Complete the steps below to reserve your appointment.</p>
        </div>

        <div class="hidden rounded-full bg-indigo-50 px-4 py-2 md:flex">
          <span class="font-semibold text-indigo-700"> Step {{ step }} </span>

          <span class="mx-2 text-gray-400"> / </span>

          <span class="text-gray-600">
            {{ steps.length }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-3 lg:grid-cols-3 gap-8">
        <!-- LEFT : STEPS -->
        <div class="lg:col-span-2 space-y-6" :class="step === 5 ? 'sm:col-span-8' : ''">
          <!-- Progress -->
          <div class="flex items-center justify-between">
            <div v-for="(label, index) in steps" :key="index" class="flex items-center flex-1">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                :class="
                  step > index + 1
                    ? 'bg-green-500 text-white'
                    : step === index + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                "
              >
                <span v-if="step > index + 1"> ✓ </span>

                <span v-else>
                  {{ index + 1 }}
                </span>
              </div>
              <span class="ml-2 text-sm text-gray-700">{{ label }}</span>
              <div v-if="index < steps.length - 1" class="flex-1 h-0.5 bg-gray-300 mx-3" />
            </div>
          </div>

          <!-- Step Card -->
          <div class="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <!-- STEP 1 -->
            <StepBookingFor v-if="step === 1" v-model="bookingFor" />

            <!-- STEP 2 -->
            <StepServices v-if="step === 2" v-model="selectedServices" />

            <!-- STEP 3 -->
            <SelectStaff
              v-if="step === 3"
              :services="selectedServices"
              v-model:preferred-staff="staffAssignments"
              v-model:staff-names="staffNames"
            />

            <!-- STEP 4 -->
            <StepSchedule
              v-if="step === 4"
              :service-ids="selectedServices.map((s) => s.id)"
              :preferred-staff-map="staffAssignments"
              v-model="booking"
            />

            <!-- STEP 5 -->
            <ReviewBooking
              v-if="step === 5"
              :booking="booking"
              :selected-services="selectedServices"
              :booking-for="bookingFor"
              :staff-names="staffNames"
              @back="step--"
              @confirm-booking="confirmBooking"
              
            />

            <!-- Controls -->
            <div class="mt-8 flex items-center justify-between">
              <button
                v-if="step > 1 && step < steps.length"
                @click="step--"
                class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Back
              </button>

              <div class="flex-1"></div>

              <button
                v-if="step < steps.length"
                @click="step++"
                :disabled="!canProceed"
                class="h-11 rounded-xl bg-indigo-600 px-6 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
              >
                {{ step === 4 ? 'Review Booking →' : 'Continue →' }}
              </button>

              <!-- <button
                v-if="step === steps.length"
                @click="confirmBooking"
                :disabled="
                  bookingLoading ||
                  !booking ||
                  !Array.isArray(booking.segments) ||
                  booking.segments.length === 0
                "
                class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {{ bookingLoading ? 'Confirming...' : 'Confirm Appointment' }}
              </button> -->
            </div>
          </div>
        </div>
        
        <!-- RIGHT : SUMMARY -->
        <div v-if="step < 5" ">
          <div
            class="sticky top-24 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg"
          >
            <div class="p-6">
              <!-- Header -->
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-900">Booking Summary</h3>

                <p class="mt-1 text-sm text-gray-500">
                  {{ selectedServices.length }}
                  {{ selectedServices.length === 1 ? 'service selected' : 'services selected' }}
                </p>
              </div>

              <!-- Services -->
              <div v-if="selectedServices.length" class="space-y-3">
                <div
                  v-for="s in selectedServices"
                  :key="s.id"
                  class="flex items-start justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div>
                    <h4 class="font-medium text-gray-900">
                      {{ s.name }}
                    </h4>
                    {{ selectedStaffNames[s.id] }}

                    <p class="mt-1 text-sm text-gray-500">⏱ {{ s.duration }} mins</p>
                  </div>

                  <div class="text-right">
                    <p class="font-semibold text-gray-900">₹{{ s.price }}</p>
                  </div>
                </div>
              </div>

              <!-- Empty -->
              <div
                v-else
                class="rounded-2xl border border-dashed border-gray-300 py-10 text-center"
              >
                <div
                  class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl"
                >
                  ✨
                </div>

                <p class="font-medium text-gray-700">No services selected</p>

                <p class="mt-1 text-sm text-gray-500">Select one or more services to begin.</p>
              </div>

              <!-- Totals -->
              <div class="mt-6 border-t border-gray-200 pt-5 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600"> Total Price </span>

                  <span class="text-2xl font-bold text-indigo-600"> ₹{{ totalPrice }} </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-gray-600"> Total Duration </span>

                  <span class="font-semibold text-gray-900"> {{ totalDuration }} mins </span>
                </div>
              </div>

              <!-- Appointment -->
              <div v-if="booking" class="mt-6 rounded-2xl bg-indigo-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Appointment Time
                </p>

                <p class="mt-2 text-lg font-semibold text-gray-900">
                  {{ formatDateTime(booking.startAt) }}
                </p>

                <p class="mt-1 text-sm text-gray-500">
                  Ends around {{ formatDateTime(booking.endAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* --------------------------------------------------
   Imports
-------------------------------------------------- */
import { ref, onMounted, computed, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import StepBookingFor from '@/components/StepBookingFor.vue'
import StepServices from '@/components/StepServices.vue'
import StepSchedule from '@/components/StepSchedule.vue'
import SelectStaff from '@/components/SelectStaff.vue'
import ReviewBooking from '@/components/ReviewBooking.vue'

import { auth, onAuthStateChanged, createBooking } from '@/services/firebase'

/* --------------------------------------------------
   Router & User
-------------------------------------------------- */
const router = useRouter()
const user = ref(null)

/* --------------------------------------------------
   Step Control
-------------------------------------------------- */
const steps = ['Who is this for?', 'Select Services', 'Select Staff', 'Date & Time', 'Review']
const step = ref(1)

/* --------------------------------------------------
   Booking State (TIMELINE)
-------------------------------------------------- */
const bookingFor = ref({
  type: 'self',
  name: '',
  phone: ''
})

const selectedServices = ref([])

/**
 * staffAssignments:
 * { serviceId: staffId | 'ANY' }
 */
const staffAssignments = ref({})
const staffNames = ref({})

/**
 * booking (TIMELINE)
 */
const booking = ref(null)

const bookingLoading = ref(false)

/* --------------------------------------------------
   Derived Values
-------------------------------------------------- */
const totalDuration = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + (s.duration || 0), 0)
)

const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + (s.price || 0), 0)
)
const selectedStaffNames = computed(() => {
  return Object.fromEntries(
    Object.entries(staffAssignments.value).map(([serviceId, staffId]) => [
      serviceId,
      staffId === 'ANY' ? 'Any Available Staff' : (staffNames.value[staffId] ?? 'Staff')
    ])
  )
})
function formatTime(value) {
  const d = new Date(value)

  return d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
}

/* --------------------------------------------------
   Step Validation
-------------------------------------------------- */
const canProceed = computed(() => {
  if (step.value === 1) return !!bookingFor.value.type
  if (step.value === 2) return selectedServices.value.length > 0
  if (step.value === 3) {
    return selectedServices.value.every((s) => staffAssignments.value[s.id])
  }
  if (step.value === 4) return !!booking.value && Array.isArray(booking.value.segments)
  return true
})

/* --------------------------------------------------
   Reset staff assignments when services change
-------------------------------------------------- */
watch(
  selectedServices,
  (services) => {
    const next = {}
    services.forEach((s) => {
      if (staffAssignments.value[s.id]) next[s.id] = staffAssignments.value[s.id]
    })
    staffAssignments.value = next

    if (services.length === 0 && step.value > 2) {
      step.value = 2
    }
  },
  { deep: true }
)

/* --------------------------------------------------
   CRITICAL: Reset timeline when services or staff change
-------------------------------------------------- */
watch(
  () => JSON.stringify({ services: selectedServices.value, staff: staffAssignments.value }),
  () => {
    booking.value = null
  }
)

/* --------------------------------------------------
   Auth Guard
-------------------------------------------------- */
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    user.value = currentUser
    bookingFor.value.name = currentUser.displayName || ''
  })
})

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */
function toDate(v) {
  if (!v) return null

  if (v instanceof Date) return v

  if (typeof v.toDate === 'function') {
    return v.toDate()
  }

  if (v._seconds != null) {
    return new Date(v._seconds * 1000 + Math.floor((v._nanoseconds || 0) / 1e6))
  }

  if (typeof v === 'string') {
    return new Date(v)
  }

  return new Date(v)
}

function formatDateTime(value) {
  const d = toDate(value)

  if (!d || isNaN(d)) return 'Invalid Date'

  return d.toLocaleString('en-CA', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/* --------------------------------------------------
   Confirm Booking
-------------------------------------------------- */
async function confirmBooking() {
  if (!booking.value || !Array.isArray(booking.value.segments)) {
    alert('Please select a time')
    return
  }
  bookingLoading.value = true

  try {
    await createBooking({
      timeline: booking.value,
      bookingFor: bookingFor.value
    })
    router.push('/profile')
  } catch (err) {
    console.error(err)
    alert(err?.message || 'Booking failed')
    booking.value = null
    step.value = 4
  } finally {
    bookingLoading.value = false
  }
}
</script>
