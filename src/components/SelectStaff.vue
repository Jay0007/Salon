<template>
  <div class="space-y-6">
    <div class="mb-8">
      <p class="mt-2 text-sm text-gray-500">
        Choose a preferred professional for each selected service.

        {{ services.length }}
        {{ services.length === 1 ? 'service' : 'services' }}
        selected.
      </p>

      <!-- <p class="mt-2 text-sm text-gray-500">
        Select a preferred professional for each service, or let us assign the earliest available
        staff.
      </p> -->
    </div>

    <div
      v-for="service in services"
      :key="service.id"
      class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <template v-for="staffOptions in [staffByService(service.id)]" :key="service.id + '-staff'">
        <div class="mb-5">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ service.name }}
          </h3>

          <p class="mt-1 text-sm text-gray-500">
            {{ service.duration }} mins • ₹{{ service.price }}
          </p>
        </div>

        <!-- No staff available -->
        <div
          v-if="staffOptions.length === 0"
          class="text-sm text-blue-800 bg-blue-100 p-2 rounded-lg border border-dashed border-gray-300 py-5 text-center"
        >
          <div class="text-3xl mb-3">👩</div>

          <p class="font-medium">Loading available staff...</p>
        </div>

        <!-- Staff selector -->

        <div class="space-y-3">
          <!-- Recommended -->
          <button
            v-if="staffOptions.length > 1"
            type="button"
            @click="onSelect(service.id, ANY)"
            class="group w-full rounded-xl border p-4 text-left transition-all duration-200"
            :class="
              (preferredStaff[service.id] ?? ANY) === ANY
                ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.01] ring-2 ring-indigo-100'
                : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
            "
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >
                    Recommended
                  </span>

                  <h4 class="font-medium text-gray-900">Any Available Staff</h4>
                </div>

                <p class="mt-1 text-sm text-gray-500">Fastest available appointment</p>
              </div>

              <div
                v-if="(preferredStaff[service.id] ?? ANY) === ANY"
                class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white"
              >
                ✓
              </div>
            </div>
          </button>
          <div v-if="staffOptions.length > 1" class="my-5 flex items-center gap-4">
            <div class="h-px flex-1 bg-gray-200"></div>

            <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Or choose a specific staff
            </span>

            <div class="h-px flex-1 bg-gray-200"></div>
          </div>
          <!-- Staff -->
          <button
            v-for="staff in staffOptions"
            :key="staff.id"
            type="button"
            @click="staffOptions.length > 1 && onSelect(service.id, staff.id)"
            class="group w-full rounded-xl border p-4 text-left transition-all duration-200"
            :class="[
              preferredStaff[service.id] === staff.id || staffOptions.length === 1
                ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.01] ring-2 ring-indigo-100'
                : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5',
              staffOptions.length === 1 ? 'cursor-default' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ring-2 ring-white shadow',
                    avatarColor(staff.id)
                  ]"
                >
                  {{ getInitials(staff.name) }}
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">
                    {{ staff.name }}
                  </h4>

                  <p class="text-sm text-gray-500">
                    {{
                      staffOptions.length === 1
                        ? 'Only staff available'
                        : 'Available for this service'
                    }}
                  </p>
                </div>
              </div>

              <div
                v-if="preferredStaff[service.id] === staff.id || staffOptions.length === 1"
                class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white"
              >
                ✓
              </div>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, watchEffect, computed } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

const ANY = 'ANY'

const props = defineProps({
  services: {
    type: Array,
    required: true
  },
  staffNames: {
    type: Object,
    required: true
  },
  preferredStaff: {
    type: Object,
    required: true
  }
})
const avatarColors = [
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-purple-100 text-purple-700'
]
const loading = ref(true)

const emit = defineEmits(['update:preferredStaff', 'update:staffNames'])

const staffList = ref([])
const staffLookup = computed(() => {
  return Object.fromEntries(staffList.value.map((staff) => [staff.id, staff.name]))
})
/* Load staff once */
onBeforeMount(async () => {
  const fn = httpsCallable(functions, 'getStaffForBooking')
  const res = await fn()
  staffList.value = Array.isArray(res.data) ? res.data : []
  loading.value = false
})

/* Staff who can do a specific service */
function staffByService(serviceId) {
  return staffList.value.filter(
    (staff) => Array.isArray(staff.services) && staff.services.includes(serviceId)
  )
}

/* Auto-assign if only ONE staff exists */
watchEffect(() => {
  const next = { ...props.preferredStaff }

  props.services.forEach((service) => {
    const staffOptions = staffByService(service.id)
    // If exactly ONE staff → auto-assign
    if (staffOptions.length === 1) {
      next[service.id] = staffOptions[0].id
      return
    }

    // If multiple staff and nothing chosen yet → default to ANY (null)
    if (staffOptions.length > 1 && !(service.id in next)) {
      next[service.id] = ANY
    }
  })
  // Emit only if changed
  if (JSON.stringify(next) !== JSON.stringify(props.preferredStaff)) {
    emit('update:preferredStaff', next)
    emit('update:staffNames', staffLookup.value)
  }
})

function onSelect(serviceId, staffId) {
  emit('update:preferredStaff', {
    ...props.preferredStaff,
    [serviceId]: staffId === ANY ? ANY : staffId
  })
  emit('update:staffNames', staffLookup.value)
}

function getInitials(name) {
  if (!name) return '?'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function avatarColor(id) {
  let hash = 0

  for (const c of id) {
    hash += c.charCodeAt(0)
  }

  return avatarColors[hash % avatarColors.length]
}
</script>
