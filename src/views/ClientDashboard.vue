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
            <StepSchedule v-if="step === 4" v-model="booking" :duration="totalDuration" />

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
                class="px-4 py-2 bg-indigo-600 text-white rounded"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import StepBookingFor from '@/components/StepBookingFor.vue'
import StepServices from '@/components/StepServices.vue'
import StepSchedule from '@/components/StepSchedule.vue'
import SelectStaff from '@/components/SelectStaff.vue'

import {
  auth,
  onAuthStateChanged,
  serverTimestamp,
  db,
  collection,
  getDocs,
  query,
  where
} from '@/services/firebase'
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
  date: null,
  startTime: null
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
  },
  { deep: true }
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
function calculateEndTime(start, duration) {
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + duration)
  return end
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

/**
 * FINAL, SAFE STAFF RESOLUTION
 * - Resolves ONLY 'ANY'
 * - Prevents overlaps
 * - Never mutates reactive state
 * - Never runs early
 */
async function resolveAnyStaff(assignments, services, startAt, endAt) {
  const resolved = { ...assignments }

  // Load staff (public read)
  const staffSnap = await getDocs(collection(db, 'staff'))
  const staffList = staffSnap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }))

  // Load relevant bookings (rules-safe)
  const bookingSnap = await getDocs(
    query(collection(db, 'bookings'), where('status', 'in', ['pending', 'confirmed']))
  )

  const existingBookings = bookingSnap.docs.map((d) => ({
    ...d.data(),
    startAt: d.data().startAt.toDate(),
    endAt: d.data().endAt.toDate()
  }))

  for (const service of services) {
    if (resolved[service.id] !== 'ANY') continue

    const eligibleStaff = staffList.filter(
      (staff) => Array.isArray(staff.services) && staff.services.includes(service.id)
    )

    const available = eligibleStaff.find((staff) => {
      const staffBookings = existingBookings.filter(
        (b) => b.staffAssignments?.[service.id] === staff.id
      )

      return staffBookings.every((b) => !overlaps(startAt, endAt, b.startAt, b.endAt))
    })

    if (!available) {
      throw new Error(`No staff available for ${service.name}`)
    }

    resolved[service.id] = available.id
  }

  return resolved
}

/* --------------------------------------------------
   Save Booking (ONLY PLACE WHERE AVAILABILITY IS CHECKED)
-------------------------------------------------- */
async function confirmBooking() {
  if (!booking.value.startTime) {
    alert('Please select date and time')
    return
  }

  const startAt = booking.value.startTime
  const endAt = calculateEndTime(startAt, totalDuration.value)

  let finalStaffAssignments

  try {
    finalStaffAssignments = await resolveAnyStaff(
      staffAssignments.value,
      selectedServices.value,
      startAt,
      endAt
    )
  } catch (err) {
    console.error(err)
    return
  }

  const bookingData = {
    userId: user.value.uid,

    bookingFor: bookingFor.value,
    services: selectedServices.value,
    staffAssignments: finalStaffAssignments,

    startAt,
    endAt,

    totalDuration: totalDuration.value,
    totalPrice: totalPrice.value,

    status: 'pending',
    createdAt: serverTimestamp()
  }

  try {
    // await addBooking(bookingData)
    await createBooking({
      serviceId,
      serviceName,
      date,
      time
    })

    router.push('/profile')
  } catch (err) {
    console.error(err)
    alert('Booking failed. Please try again.')
  }
}
</script>
