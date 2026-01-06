<template>
  <div class="border rounded-lg bg-white shadow-sm p-4">
    <h3 class="font-medium mb-3">{{ staff.name }}</h3>

    <TimeGrid :blocked="blocked" :open-hour="salon.openHour" :close-hour="salon.closeHour" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { db } from '@/services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import TimeGrid from './TimeGrid.vue'

const props = defineProps({
  staff: Object,
  date: String
})

const blocked = ref([])
const salon = {
  openHour: 10,
  closeHour: 20
}

async function loadCalendar() {
  const docId = `${props.staff.id}_${props.date}`
  const refDoc = doc(db, 'staffCalendars', docId)
  const snap = await getDoc(refDoc)

  blocked.value = snap.exists() ? snap.data().blocked || [] : []
}

watch(() => props.date, loadCalendar, { immediate: true })
</script>
