<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">Assign Staff</h2>

    <div v-for="service in services" :key="service.id" class="border rounded-lg p-4">
      <p class="font-medium mb-2">{{ service.name }}</p>

      <!-- No staff available -->
      <p v-if="staffByService(service.id).length === 0" class="text-sm text-red-500">
        No staff available for this service
      </p>

      <!-- Staff selector -->
      <select
        v-else
        :value="modelValue[service.id] || ''"
        @change="onSelect(service.id, $event.target.value)"
        class="w-full border rounded px-3 py-2"
      >
        <option disabled value="">Select staff</option>

        <!-- Any staff option (only if >1 staff) -->
        <option v-if="staffByService(service.id).length > 1" value="ANY">
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
import { ref, onMounted, watchEffect } from 'vue'
import { getDocs, collection } from 'firebase/firestore'
import { db } from '@/services/firebase'

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
onMounted(async () => {
  const snap = await getDocs(collection(db, 'staff'))
  staffList.value = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }))
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

    // Auto-assign only if exactly one staff and nothing selected yet
    if (staffOptions.length === 1 && !next[service.id]) {
      next[service.id] = staffOptions[0].id
    }
  })

  // Emit only if something actually changed
  if (JSON.stringify(next) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', next)
  }
})

function onSelect(serviceId, staffId) {
  emit('update:modelValue', {
    ...props.modelValue,
    [serviceId]: staffId
  })
}
</script>
