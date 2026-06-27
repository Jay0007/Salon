<template>
  <div class="relative border-gray-200 space-y-1">
    <div v-for="slot in timeSlots" :key="slot.label" class="relative h-10 flex items-center">
      <!-- Time label -->
      <div class="absolute text-xs px-3 text-gray-400">
        {{ slot.label }}
      </div>

      <!-- Slot background -->
      <div
        class="w-full h-9 rounded-xl"
        :class="isBlocked(slot.start, slot.end) ? 'bg-red-200' : 'bg-green-100 hover:bg-gray-200'"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  blocked: { type: Array, default: () => [] },
  openHour: { type: Number, required: true },
  closeHour: { type: Number, required: true }
})
const DEBUG = false

/* -----------------------------------
   SLOT GENERATION (30-MIN GRID)
----------------------------------- */

const timeSlots = computed(() => {
  const slots = []
  for (let h = props.openHour; h < props.closeHour; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push({
        start: h * 60 + m,
        end: h * 60 + m + 15,
        label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} - ${String(h).padStart(2, '0')}:${String(m + 15).padStart(2, '0')}`
      })
    }
  }
  if (DEBUG) {
    console.log('Generated slots:', slots)
  }
  return slots
})

/* -----------------------------------
   BLOCK CHECK (UTC-SAFE)
----------------------------------- */

function isBlocked(startMin, endMin) {
  return props.blocked.some((b) => {
    const start = toDate(b.startAt)
    const end = toDate(b.endAt)

    if (DEBUG) {
      console.log('Checking block:', { start, end })
    }

    const s = toMinutes(b.startAt)
    const e = toMinutes(b.endAt)

    return startMin < e && endMin > s
  })
}
function toDate(v) {
  if (!v) return null

  if (v instanceof Date) return v

  if (typeof v.toDate === 'function') {
    return v.toDate()
  }

  if (v._seconds != null) {
    return new Date(v._seconds * 1000 + Math.floor((v._nanoseconds || 0) / 1e6))
  }

  if (typeof v === 'string') {
    return new Date(v)
  }

  return new Date(v)
}

function toMinutes(value) {
  const d = toDate(value)

  if (!d) return -1

  return d.getUTCHours() * 60 + d.getUTCMinutes()
}
</script>
