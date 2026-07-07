<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div class="flex items-center justify-between">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl" :class="card.iconBg">
          <span class="text-xl">{{ card.icon }}</span>
        </div>

        <span class="text-3xl font-bold text-gray-900">
          {{ card.value }}
        </span>
      </div>

      <h3 class="mt-5 text-sm font-semibold text-gray-900">
        {{ card.label }}
      </h3>

      <p class="mt-1 text-xs text-gray-500">
        {{ card.description }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  upcoming: Number,
  completed: Number,
  cancelled: Number,
  totalSpent: Number
})

const cards = computed(() => [
  {
    label: 'Upcoming',
    value: props.upcoming,
    icon: '📅',
    iconBg: 'bg-blue-100',
    description: 'Scheduled appointments'
  },
  {
    label: 'Completed',
    value: props.completed,
    icon: '✅',
    iconBg: 'bg-green-100',
    description: 'Visits completed'
  },
  {
    label: 'Cancelled',
    value: props.cancelled,
    icon: '❌',
    iconBg: 'bg-red-100',
    description: 'Cancelled appointments'
  },
  {
    label: 'Total Spent',
    value: `₹${props.totalSpent.toLocaleString()}`,
    icon: '💰',
    iconBg: 'bg-amber-100',
    description: 'Lifetime spending'
  }
])
</script>
