<template>
  <div class="max-w-6xl mx-auto p-1 space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-xl border shadow-sm p-5 mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Left -->
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Staff Calendar</h1>
          <p class="text-sm text-gray-500 mt-1">View staff availability and appointments.</p>
        </div>

        <!-- Right Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="
              selectedDate = new Date(new Date().setDate(new Date(selectedDate).getDate() - 1))
                .toISOString()
                .slice(0, 10)
            "
            class="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 transition"
          >
            ←
          </button>

          <input
            type="date"
            v-model="selectedDate"
            class="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />

          <button
            @click="selectedDate = new Date().toISOString().slice(0, 10)"
            class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Today
          </button>

          <button
            @click="
              selectedDate = new Date(
                new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)
              )
                .toISOString()
                .slice(0, 10)
            "
            class="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 transition"
          >
            →
          </button>

          <button
            @click="loadStaff"
            class="ml-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
    <!-- Loading -->
    <div v-if="loading" class="bg-white border rounded-xl p-8 text-center text-gray-500">
      Loading staff...
    </div>

    <!-- Staff -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <StaffDayCalendar v-for="s in staff" :key="s.id" :staff="s" :date="selectedDate" />
    </div>

    <!-- Empty -->
    <div
      v-if="!loading && !staff.length"
      class="bg-white border rounded-xl p-10 text-center text-gray-500"
    >
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
