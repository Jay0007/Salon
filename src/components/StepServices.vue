<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Choose Your Services</h2>

      <p class="mt-2 text-sm text-gray-500">Select one or more services for your appointment.</p>
    </div>
    <!-- Services -->
    <div v-if="!loading" class="space-y-8">
      <div v-for="(group, category) in groupedServices" :key="category">
        <div class="mb-5 flex items-center">
          <span
            class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600"
          >
            {{ category }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="service in group"
            :key="service.id"
            @click="toggle(service)"
            class="group w-full rounded-2xl border p-5 text-left transition-all duration-200"
            :class="
              isSelected(service.id)
                ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
            "
          >
            <div class="flex items-start justify-between">
              <!-- Left -->
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-semibold text-gray-900">
                    {{ service.name }}
                  </h4>

                  <span
                    v-if="isSelected(service.id)"
                    class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    Selected
                  </span>
                </div>

                <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span> ⏱ {{ service.duration }} mins </span>

                  <span> ₹{{ service.price }} </span>
                </div>
              </div>

              <!-- Check -->
              <div
                class="ml-4 flex h-8 w-8 items-center justify-center rounded-full transition-all"
                :class="
                  isSelected(service.id)
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 text-transparent group-hover:border-indigo-400'
                "
              >
                ✓
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-else
      class="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400"
    >
      Loading services...
    </div>
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
