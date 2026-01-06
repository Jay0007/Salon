<template>
  <div class="border rounded-lg p-4 bg-white shadow-sm">
    <h3 class="font-medium mb-2">{{ staffName }}</h3>

    <div class="h-2 bg-gray-200 rounded overflow-hidden">
      <div class="h-full bg-indigo-600" :style="{ width: utilization + '%' }" />
    </div>

    <p class="text-sm text-gray-600 mt-2">{{ utilization }}% utilized</p>
  </div>
</template>

<script setup>
defineProps({
  staffName: String,
  utilization: Number
})
</script>
