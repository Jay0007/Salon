<template>
  <div class="flex items-center justify-between px-6 py-4">
    <p class="text-sm font-medium text-gray-500">
      {{ label }}
    </p>

    <p class="text-sm font-semibold text-gray-900">
      {{ value }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: String
})
</script>
