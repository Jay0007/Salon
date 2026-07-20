<template>
  <div class="mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <button
        :disabled="loading"
        type="button"
        @click="$emit('back')"
        class="disabled:pointer-events-none disabled:opacity-40 mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        ← Back
      </button>

      <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#9E342A]/10">
        <svg
          class="h-8 w-8 text-[#9E342A]"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 class="text-3xl font-bold tracking-tight text-gray-900">Review Your Appointment</h2>

      <p class="mt-2 text-gray-500">
        Please verify your booking details before confirming your appointment.
      </p>
    </div>

    <!-- Customer -->

    <section class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#9E342A] to-[#c85a4b] text-white shadow-md font-semibold"
        >
          {{ initials(customerName) }}
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700"
            >
              ✓
            </div>

            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Customer</p>
          </div>

          <h3 class="mt-3 text-lg font-semibold text-gray-900">
            {{ customerName }}
          </h3>

          <p class="mt-1 text-sm text-gray-500">
            <span
              class="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
            >
              {{ bookingType }}
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Staff -->

    <section class="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="mb-6 flex items-center gap-2">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700"
        >
          ✓
        </div>

        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          Assigned Professionals
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="assignment in reviewAssignments"
          :key="assignment.serviceId"
          class="flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-[#9E342A]/30 hover:shadow-sm"
        >
          <div>
            <p class="font-bold text-gray-900">
              {{ assignment.serviceName }} |
              <span class="font-semibold text-gray-600">{{ assignment.serviceCategory }}</span>
            </p>

            <p class="mt-1 text-sm text-gray-500">
              Assigned to
              <span class="font-medium text-gray-700">
                {{ assignment.staffName }}
              </span>
            </p>
            <p class="mt-1 text-sm text-gray-500">
              Duration: {{ assignment.serviceDuration }} mins | Price: ₹{{
                assignment.servicePrice
              }}
              | Time: {{ formatTime(assignment.serviceStart) }} -
              {{ formatTime(assignment.serviceEnd) }}
            </p>
          </div>

          <div
            class="flex h-11 w-11 items-center justify-center rounded-full bg-[#9E342A]/10 font-semibold text-[#9E342A]"
          >
            {{ initials(assignment.serviceName) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Important -->

    <section class="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <div class="mb-4 flex items-center gap-2">
        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs">
          !
        </div>

        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Important Information
        </p>
      </div>

      <ul class="space-y-3 text-sm leading-6 text-amber-900">
        <li class="flex gap-3">
          <span>•</span>
          <span>
            Please arrive at least
            <strong>10 minutes early</strong>
            for your appointment.
          </span>
        </li>

        <li class="flex gap-3">
          <span>•</span>
          <span>
            Appointments may be cancelled or rescheduled up to
            <strong>24 hours</strong>
            before the scheduled appointment.
          </span>
        </li>

        <li class="flex gap-3">
          <span>•</span>
          <span> If you're running late, please contact the salon as soon as possible. </span>
        </li>
      </ul>
    </section>

    <!-- Confirmation -->

    <section class="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6">
      <label class="flex cursor-pointer items-start gap-4">
        <input
          v-model="accepted"
          type="checkbox"
          class="mt-1 h-5 w-5 rounded border-gray-300 text-[#9E342A] focus:ring-[#9E342A]"
        />

        <div>
          <p class="font-medium text-gray-900">I confirm these appointment details are correct.</p>

          <p class="mt-1 text-sm text-gray-500">
            I confirm that all appointment information is correct and I'm ready to book.
          </p>
        </div>
      </label>

      <button
        type="button"
        @click="$emit('confirmBooking')"
        :disabled="!accepted || loading"
        class="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#9E342A] px-6 py-5 text-lg font-semibold text-white transition duration-200 hover:bg-[#842b22] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg v-if="loading" class="mr-3 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />

          <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>

        {{ loading ? 'Creating your appointment...' : 'Confirm Appointment' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  bookingFor: {
    type: Object,
    required: true
  },

  selectedServices: {
    type: Array,
    required: true
  },

  booking: {
    type: Object,
    required: true
  },
  staffNames: {
    type: Object,
    default: () => {}
  }
})

const emit = defineEmits(['back', 'confirm'])

const accepted = ref(false)
const loading = ref(false)

const customerName = computed(() => {
  if (props.bookingFor?.type === 'self') {
    return props.bookingFor?.name || 'Myself'
  }

  return props.bookingFor?.name || 'Guest'
})

const bookingType = computed(() => {
  return props.bookingFor?.type === 'self' ? 'Booking for Myself' : 'Booking for Someone Else'
})

function initials(name) {
  if (!name) return '?'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function toDate(value) {
  if (!value) return null

  if (value instanceof Date) return value

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  if (value._seconds != null) {
    return new Date(value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1e6))
  }

  if (typeof value === 'string') {
    return new Date(value)
  }

  return new Date(value)
}
function formatDate(value) {
  const d = toDate(value)
  if (!d) return ''

  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(value) {
  const d = toDate(value)
  if (!d) return ''

  return d.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
const reviewAssignments = computed(() => {
  if (!props.booking?.segments) return []

  return props.booking.segments.map((segment) => {
    const service = props.selectedServices.find((s) => s.id === segment.serviceId)

    return {
      serviceId: segment.serviceId,
      serviceCategory: service?.category ?? 'Service',
      serviceStart: segment.startAt,
      serviceEnd: segment.endAt,
      serviceDuration: service?.duration ?? 0,
      servicePrice: service?.price ?? 0,
      serviceName: service?.name ?? 'Service',
      staffName: props.staffNames?.[segment.staffId] ?? 'Any Available Staff'
    }
  })
})
</script>
