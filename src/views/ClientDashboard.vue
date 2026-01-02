<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-12 px-4">
      <h1 class="text-3xl font-semibold text-gray-800 mb-6">Book a Service</h1>

      <div class="flex flex-col lg:flex-row gap-6 mt-6 max-w-7xl mx-auto px-4">
        <!-- LEFT -->
        <div class="w-full lg:w-2/3 space-y-4">
          <!-- Progress -->
          <div class="flex items-center justify-between mb-6">
            <div v-for="(label, index) in steps" :key="index" class="flex items-center w-full">
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
                {{ index + 1 }}
              </div>
              <span class="ml-2 text-sm">{{ label }}</span>
              <div v-if="index < steps.length - 1" class="flex-1 h-0.5 bg-gray-300 mx-2"></div>
            </div>
          </div>

          <!-- Step Content -->
          <div class="bg-white p-6 shadow rounded-lg border">
            <!-- STEP 1 -->
            <StepBookingFor v-if="step === 1" v-model="bookingFor" />

            <!-- STEP 2 -->
            <StepServices v-if="step === 2" v-model="selectedServices" />

            <!-- STEP 3 -->
            <SelectStaff
              v-if="step === 3"
              :services="selectedServices"
              v-model="staffAssignments"
            />

            <!-- STEP 4 -->
            <StepSchedule
              v-if="step === 4"
              :service-ids="selectedServices.map((s) => s.id)"
              :preferred-staff-map="staffAssignments"
              @update="handleScheduleUpdate"
            />

            <!-- Controls -->
            <div class="mt-6 flex justify-between">
              <button v-if="step > 1" @click="step--" class="px-4 py-2 border rounded">Back</button>

              <div class="flex-1"></div>

              <button
                v-if="step < 4"
                @click="step++"
                :disabled="!canProceed"
                class="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
              >
                Next
              </button>

              <button
                v-if="step === 4"
                @click="confirmBooking"
                :disabled="!booking.startAt || !booking.endAt"
                class="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="w-full lg:w-1/3">
          <div class="sticky top-24 bg-white border p-4 shadow rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Summary</h3>

            <ul v-if="selectedServices.length">
              <li
                v-for="s in selectedServices"
                :key="s.id"
                class="flex justify-between text-sm mb-1"
              >
                <span>{{ s.name }}</span>
                <span>₹{{ s.price }}</span>
              </li>
            </ul>

            <p v-else class="text-sm text-gray-400">No services selected</p>

            <div class="mt-4 pt-4 border-t text-sm">
              <div class="flex justify-between">
                <span>Total</span>
                <span>₹{{ totalPrice }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>Duration</span>
                <span>{{ totalDuration }} min</span>
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

import { auth, onAuthStateChanged } from '@/services/firebase'
import { createBooking } from '@/services/firebase'

/* --------------------------------------------------
   Router & User
-------------------------------------------------- */
const router = useRouter()
const user = ref(null)

/* --------------------------------------------------
   Step Control
-------------------------------------------------- */
const steps = ['Who is this for?', 'Select Services', 'Select Staff', 'Date & Time']
const step = ref(1)

/* --------------------------------------------------
   Booking State
-------------------------------------------------- */
const bookingFor = ref({
  type: 'self',
  name: '',
  phone: ''
})

const selectedServices = ref([])

/**
 * staffAssignments:
 * {
 *   serviceId: staffId | 'ANY'
 * }
 */
const staffAssignments = ref({})

const booking = ref({
  startAt: null, // ISO string
  endAt: null // ISO string
})

/* --------------------------------------------------
   Derived Values
-------------------------------------------------- */
const totalDuration = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + (s.duration || 0), 0)
)

const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + (s.price || 0), 0)
)

/* --------------------------------------------------
   Step Validation
-------------------------------------------------- */
const canProceed = computed(() => {
  if (step.value === 1) return !!bookingFor.value.type
  if (step.value === 2) return selectedServices.value.length > 0

  if (step.value === 3) {
    return selectedServices.value.every((s) => staffAssignments.value[s.id])
  }

  return true
})

/* --------------------------------------------------
   Cleanup staff assignments when services change
-------------------------------------------------- */
watch(
  selectedServices,
  (services) => {
    const next = {}

    services.forEach((s) => {
      if (staffAssignments.value[s.id]) {
        next[s.id] = staffAssignments.value[s.id]
      }
    })

    staffAssignments.value = next
    console.log(
      'Selected services:',
      services.map((s) => s.id)
    )
    if (!Array.isArray(services) || services.length === 0) {
      // Reset downstream steps if services disappear
      if (step.value > 2) {
        step.value = 2
      }
    }
  },
  { deep: true }
)
watchEffect(() => {
  if (step.value >= 3) {
    console.assert(
      selectedServices.value.length > 0,
      'Selected services missing at step',
      step.value
    )
  }
})

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

function handleScheduleUpdate({ startAt, endAt }) {
  booking.value.startAt = startAt
  booking.value.endAt = endAt
}

async function confirmBooking() {
  if (
    !booking.value.startAt ||
    !booking.value.endAt ||
    !Array.isArray(selectedServices.value) ||
    selectedServices.value.length === 0
  ) {
    alert('Please select services and time')
    return
  }

  const serviceIds = selectedServices.value.map((s) => s.id).filter(Boolean)

  if (serviceIds.length !== selectedServices.value.length) {
    alert('Invalid service selection. Please reselect services.')
    return
  }

  try {
    await createBooking({
      serviceIds,
      preferredStaffMap: staffAssignments.value,
      startAt: booking.value.startAt,
      endAt: booking.value.endAt,
      bookingFor: bookingFor.value
    })

    router.push('/profile')
  } catch (err) {
    console.error(err)
    if (err?.code === 'functions/already-exists' || err?.message?.includes('no longer available')) {
      alert(
        'Sorry, this time slot was just booked by someone else. Please choose another available time.'
      )

      // Reset only the schedule step
      booking.value.startAt = null
      booking.value.endAt = null
      step.value = 4

      return
    }

    alert(err?.message || 'Booking failed')
  }
}
</script>
