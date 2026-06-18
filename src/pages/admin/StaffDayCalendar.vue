<template>
  <div class="rounded-2xl border py-4 px-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">
          {{ staff.name }}
        </h3>
        <p class="text-sm text-gray-500">
          {{ formattedDate }}
        </p>
      </div>

      <span
        class="text-xs font-medium px-3 py-1 rounded-full"
        :class="blocked.length ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
      >
        {{ blocked.length ? 'Busy' : 'Fully available' }}
      </span>
    </div>

    <!-- Calendar -->
    <div v-if="loading" class="text-sm text-gray-400 italic">Loading calendar…</div>

    <TimeGrid v-else :blocked="blocked" :open-hour="salon.openHour" :close-hour="salon.closeHour" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'
import TimeGrid from './TimeGrid.vue'

const props = defineProps({
  staff: { type: Object, required: true },
  date: { type: String, required: true }
})

const blocked = ref([])
const loading = ref(false)

const salon = {
  openHour: 10,
  closeHour: 20
}

const formattedDate = computed(() =>
  new Date(props.date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
)

async function loadCalendar() {
  loading.value = true
  try {
    const fn = httpsCallable(functions, 'getStaffCalendarAdmin')
    const res = await fn({
      staffId: props.staff.id,
      date: props.date
    })

    blocked.value = res.data || []
    console.log('Loaded blocked periods:', blocked.value, res)
  } catch (e) {
    console.error('Failed to load staff calendar:', e)
    blocked.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.date, loadCalendar, { immediate: true })
</script>
