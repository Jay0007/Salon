<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-800 mb-6">Select Services</h2>

    <!-- Services -->
    <div v-if="!loading" class="space-y-8">
      <div v-for="(group, category) in groupedServices" :key="category">
        <h3 class="text-lg font-medium text-gray-700 mb-3">
          {{ category }}
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="service in group"
            :key="service.id"
            @click="toggle(service)"
            class="border rounded-xl p-4 flex justify-between text-left transition"
            :class="
              isSelected(service.id)
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-400'
            "
          >
            <!-- Left -->
            <div>
              <p class="font-medium text-gray-800">
                {{ service.name }}
              </p>
              <p class="text-sm text-gray-500 mt-1">{{ service.duration }} min</p>
            </div>

            <!-- Right -->
            <div class="text-right">
              <p class="font-semibold text-indigo-600">₹{{ service.price }}</p>

              <span
                v-if="isSelected(service.id)"
                class="inline-block mt-2 text-xs font-medium text-indigo-600"
              >
                Selected
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <p v-else class="text-gray-400 text-sm text-center">Loading services…</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db, collection, getDocs, query, where, orderBy } from '@/services/firebase'

/* ---------------- Props / Emits ---------------- */

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

/* ---------------- State ---------------- */

const services = ref([])
const loading = ref(true)

/* ---------------- Computed ---------------- */

const groupedServices = computed(() => {
  const map = {}
  services.value.forEach((s) => {
    if (!map[s.category]) map[s.category] = []
    map[s.category].push(s)
  })
  return map
})

function isSelected(id) {
  return props.modelValue.some((s) => s.id === id)
}

/* ---------------- Methods ---------------- */

function toggle(service) {
  const exists = props.modelValue.some((s) => s.id === service.id)

  const next = exists
    ? props.modelValue.filter((s) => s.id !== service.id)
    : [...props.modelValue, service]

  // 🔴 ALWAYS emit a new array
  emit('update:modelValue', next)
}

async function loadServices() {
  loading.value = true

  const q = query(
    collection(db, 'services'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc')
  )

  const snap = await getDocs(q)
  services.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  loading.value = false
}

/* ---------------- Lifecycle ---------------- */

onMounted(loadServices)
</script>
