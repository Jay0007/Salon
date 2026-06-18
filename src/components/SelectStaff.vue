<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">Assign Staff</h2>

    <div v-for="service in services" :key="service.id" class="border rounded-lg p-4">
      <p class="font-medium mb-2">{{ service.name }}</p>

      <!-- No staff available -->
      <p
        v-if="staffByService(service.id).length === 0"
        class="text-sm text-blue-800 bg-blue-100 p-3 rounded-lg"
      >
        Loading staff...
      </p>

      <!-- Staff selector -->
      <select
        v-else
        :value="modelValue[service.id] ?? ANY"
        @change="onSelect(service.id, $event.target.value)"
        class="w-full border rounded px-3 py-2"
      >
        <option disabled value="">Select staff</option>

        <!-- Any staff option (only if >1 staff) -->
        <option v-if="staffByService(service.id).length > 1" :value="ANY">
          Any available staff
        </option>

        <option v-for="staff in staffByService(service.id)" :key="staff.id" :value="staff.id">
          {{ staff.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, watchEffect } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

const ANY = 'ANY'

const props = defineProps({
  services: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const staffList = ref([])

/* Load staff once */
onBeforeMount(async () => {
  const fn = httpsCallable(functions, 'getStaffForBooking')
  const res = await fn()
  staffList.value = Array.isArray(res.data) ? res.data : []
})

/* Staff who can do a specific service */
function staffByService(serviceId) {
  return staffList.value.filter(
    (staff) => Array.isArray(staff.services) && staff.services.includes(serviceId)
  )
}

/* Auto-assign if only ONE staff exists */
watchEffect(() => {
  const next = { ...props.modelValue }

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
  if (JSON.stringify(next) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', next)
  }
})

function onSelect(serviceId, staffId) {
  emit('update:modelValue', {
    ...props.modelValue,
    [serviceId]: staffId === ANY ? ANY : staffId
  })
}
</script>
