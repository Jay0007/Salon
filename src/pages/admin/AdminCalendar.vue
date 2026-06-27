<template>
  <div class="max-w-6xl mx-auto p-1 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Staff Calendar</h1>

      <input type="date" v-model="selectedDate" class="border rounded-lg px-3 py-2 text-sm" />
    </div>
    <button
      @click="loadStaff"
      class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
    >
      Refresh
    </button>
    <!-- Loading -->
    <div v-if="loading" class="text-sm text-gray-400">Loading staff…</div>

    <!-- Staff Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StaffDayCalendar v-for="s in staff" :key="s.id" :staff="s" :date="selectedDate" />
    </div>

    <!-- Empty -->
    <div v-if="!loading && staff.length === 0" class="text-sm text-gray-500">
      No active staff found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'
import StaffDayCalendar from './StaffDayCalendar.vue'

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const staff = ref([])
const loading = ref(false)

async function loadStaff() {
  loading.value = true
  try {
    const fn = httpsCallable(functions, 'getStaffAdmin')
    const res = await fn()
    staff.value = res.data || []
  } catch (e) {
    console.error('Failed to load staff:', e)
    staff.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadStaff)
</script>
