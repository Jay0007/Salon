<template>
  <div class="max-w-7xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Staff Calendar</h1>

    <!-- DATE PICKER -->
    <input type="date" v-model="selectedDate" class="border rounded px-3 py-2 mb-6" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StaffDayCalendar v-for="s in staff" :key="s.id" :staff="s" :date="selectedDate" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs } from 'firebase/firestore'
import StaffDayCalendar from './StaffDayCalendar.vue'

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const staff = ref([])

async function loadStaff() {
  const snap = await getDocs(collection(db, 'staff'))
  staff.value = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }))
}

onMounted(loadStaff)
</script>
