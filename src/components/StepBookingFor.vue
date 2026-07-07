<template>
  <div class="space-y-8">
    <!-- Heading -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Who is this appointment for?</h2>

      <p class="mt-1 text-sm text-gray-500">Choose who will receive this appointment.</p>
    </div>

    <!-- Cards -->
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Myself -->
      <button
        @click="select('self')"
        class="rounded-2xl border p-5 text-left transition-all duration-200"
        :class="
          bookingFor.type === 'self'
            ? 'border-indigo-600 bg-indigo-50 shadow'
            : 'border-gray-200 hover:border-indigo-300 hover:shadow'
        "
      >
        <div class="flex items-start justify-between">
          <div>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl"
            >
              👤
            </div>

            <h3 class="text-lg font-semibold text-gray-900">Myself</h3>

            <p class="mt-1 text-sm text-gray-500">Book using my account information.</p>
          </div>

          <div
            v-if="bookingFor.type === 'self'"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white"
          >
            ✓
          </div>
        </div>
      </button>

      <!-- Someone Else -->
      <button
        @click="select('other')"
        class="rounded-2xl border p-5 text-left transition-all duration-200"
        :class="
          bookingFor.type === 'other'
            ? 'border-indigo-600 bg-indigo-50 shadow'
            : 'border-gray-200 hover:border-indigo-300 hover:shadow'
        "
      >
        <div class="flex items-start justify-between">
          <div>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl"
            >
              👥
            </div>

            <h3 class="text-lg font-semibold text-gray-900">Someone Else</h3>

            <p class="mt-1 text-sm text-gray-500">Book for a family member or friend.</p>
          </div>

          <div
            v-if="bookingFor.type === 'other'"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white"
          >
            ✓
          </div>
        </div>
      </button>
    </div>

    <!-- Guest Form -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="bookingFor.type === 'other'"
        class="rounded-2xl border border-gray-200 bg-gray-50 p-6"
      >
        <h3 class="mb-5 text-lg font-semibold text-gray-900">Guest Information</h3>

        <div class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700"> Full Name </label>

            <input
              v-model="bookingFor.name"
              type="text"
              placeholder="Enter guest name"
              class="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700"> Phone Number </label>

            <input
              v-model="bookingFor.phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              @input="enforcePrefix"
              class="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { auth } from '@/services/firebase'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const bookingFor = ref(
  props.modelValue || {
    type: 'self',
    name: '',
    phone: ''
  }
)

// 🟩 Set current user name on mount if booking for self
onMounted(() => {
  const user = auth.currentUser
  if (bookingFor.value.type === 'self' && user?.displayName) {
    bookingFor.value.name = user.displayName
  }
})

function select(type) {
  bookingFor.value.type = type

  if (type === 'self') {
    const user = auth.currentUser
    bookingFor.value.name = user?.displayName || ''
    bookingFor.value.phone = ''
  } else {
    if (!bookingFor.value.phone || bookingFor.value.phone === '') {
      bookingFor.value.phone = '+91'
    }
    bookingFor.value.name = ''
  }
}

function enforcePrefix() {
  if (!bookingFor.value.phone.startsWith('+91')) {
    bookingFor.value.phone = '+91'
  }
}

// 🔁 Emit full object on change
watch(
  bookingFor,
  () => {
    emit('update:modelValue', { ...bookingFor.value })
  },
  { deep: true }
)

function buttonClass(type) {
  return bookingFor.value.type === type
    ? 'bg-indigo-600 text-white'
    : 'bg-white text-black-700 hover:bg-indigo-50'
}
</script>
