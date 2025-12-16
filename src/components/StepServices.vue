<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Select Services</h2>

    <div v-for="(group, category) in categorizedServices" :key="category" class="mb-6">
      <h3 class="text-lg font-bold text-indigo-700 mb-2">{{ category }}</h3>
      <div class="space-y-3">
        <div
          v-for="service in group"
          :key="service.id"
          class="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
        >
          <div>
            <h4 class="font-medium">{{ service.name }}</h4>
            <p class="text-sm text-gray-500">${{ service.price }} · {{ service.duration }} min</p>
          </div>
          <button
            @click="toggleService(service)"
            :class="[
              'px-3 py-1 rounded text-sm font-medium',
              isSelected(service) ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
            ]"
          >
            {{ isSelected(service) ? 'Remove' : 'Add' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const selected = ref([...props.modelValue])

const services = [
  { id: 1, name: 'Full Face Makeup', price: 70, duration: 45, category: 'Makeup' },
  { id: 2, name: 'Bridal Makeup', price: 150, duration: 90, category: 'Makeup' },
  { id: 3, name: 'Hair Styling', price: 40, duration: 30, category: 'Hair' },
  { id: 4, name: 'Hair Wash & Blowdry', price: 30, duration: 25, category: 'Hair' },
  { id: 5, name: 'Henna - One Hand', price: 25, duration: 30, category: 'Henna' },
  { id: 6, name: 'Henna - Both Hands', price: 45, duration: 60, category: 'Henna' },
  { id: 7, name: 'Eyebrow Threading', price: 10, duration: 10, category: 'Threading' },
  { id: 8, name: 'Upper Lip Threading', price: 8, duration: 5, category: 'Threading' }
]

const categorizedServices = computed(() => {
  const map = {}
  for (const service of services) {
    if (!map[service.category]) map[service.category] = []
    map[service.category].push(service)
  }
  return map
})

function isSelected(service) {
  return selected.value.some((s) => s.id === service.id)
}

function toggleService(service) {
  if (isSelected(service)) {
    selected.value = selected.value.filter((s) => s.id !== service.id)
  } else {
    selected.value.push(service)
  }
}

watch(
  selected,
  () => {
    emit('update:modelValue', selected.value)
  },
  { deep: true }
)
</script>
