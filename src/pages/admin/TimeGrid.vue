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
  return slots
})

/* -----------------------------------
   BLOCK CHECK (UTC-SAFE)
----------------------------------- */

function isBlocked(startMin, endMin) {
  return props.blocked.some((b) => {
    const s = toMinutesUTC(b.startAt)
    const e = toMinutesUTC(b.endAt)
    console.log(
      `Checking slot ${startMin}-${endMin} against blocked ${s}-${e}:`,
      startMin < e && endMin > s
    )
    return startMin < e && endMin > s
  })
}

function toMinutesUTC(iso) {
  const d = new Date(iso)
  // console.log('Converted', iso, 'to minutes UTC:', d.getUTCHours() * 60 + d.getUTCMinutes())
  return d.getUTCHours() * 60 + d.getUTCMinutes() + 330
}
</script>
