<template>
  <div class="relative border-l pl-4">
    <div v-for="slot in timeSlots" :key="slot.label" class="relative h-10">
      <div class="absolute -left-12 text-xs text-gray-400">
        {{ slot.label }}
      </div>

      <div
        v-if="isBlocked(slot.start, slot.end)"
        class="absolute left-0 right-0 top-1 bottom-1 bg-red-200 rounded"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  blocked: Array,
  openHour: Number,
  closeHour: Number
})

function generateSlots() {
  const slots = []
  for (let h = props.openHour; h < props.closeHour; h++) {
    for (let m of [0, 30]) {
      slots.push({
        start: h * 60 + m,
        end: h * 60 + m + 30,
        label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      })
    }
  }
  return slots
}

const timeSlots = computed(generateSlots)

function isBlocked(startMin, endMin) {
  return props.blocked.some((b) => {
    const s = toMinutes(b.startAt)
    const e = toMinutes(b.endAt)
    return startMin < e && endMin > s
  })
}

function toMinutes(iso) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}
</script>
