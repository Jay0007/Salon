<template>
  <div class="max-w-5xl mx-auto py-10 px-4">
    <h1 class="text-2xl font-semibold mb-6">Staff Utilization</h1>

    <input type="date" v-model="selectedDate" class="border rounded px-3 py-2 mb-6" />

    <button
      @click="loadUtilization"
      class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
    >
      Refresh
    </button>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StaffUtilizationCard
        v-for="u in utilization"
        :key="u.staffId"
        :staff-name="u.name"
        :utilization="u.utilizationPercent"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions, db } from '@/services/firebase'
import { collection, getDocs } from 'firebase/firestore'
import StaffUtilizationCard from '@/components/StaffUtilizationCard.vue'

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const utilization = ref([])

async function loadUtilization() {
  utilization.value = []

  const staffSnap = await getDocs(collection(db, 'staff'))
  const fn = httpsCallable(functions, 'getStaffUtilization')

  for (const doc of staffSnap.docs) {
    const res = await fn({
      staffId: doc.id,
      date: selectedDate.value
    })

    utilization.value.push({
      staffId: doc.id,
      name: doc.data().name,
      ...res.data
    })
  }
}

watch(selectedDate, loadUtilization, { immediate: true })
</script>
