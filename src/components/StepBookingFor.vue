<template>
  <div class="bg-white p-6 rounded-lg shadow border mb-6">
    <h2 class="text-xl font-semibold mb-4">Who is the booking for?</h2>
    <div class="flex gap-4">
      <button
        @click="select('self')"
        :class="buttonClass('self')"
        class="px-4 py-2 rounded-lg border"
      >
        Myself
      </button>
      <button
        @click="select('other')"
        :class="buttonClass('other')"
        class="px-4 py-2 rounded-lg border"
      >
        Someone else
      </button>
    </div>

    <div v-if="bookingFor.type === 'other'" class="mt-4 space-y-2">
      <input
        v-model="bookingFor.name"
        type="text"
        placeholder="Guest Name"
        class="w-full p-2 border rounded"
      />
      <input
        v-model="bookingFor.phone"
        type="tel"
        placeholder="+91XXXXXXXXXX"
        class="w-full p-2 border rounded"
        @input="enforcePrefix"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { auth } from '@/services/firebase'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const bookingFor = ref({
  type: 'self',
  name: '',
  phone: ''
})

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
