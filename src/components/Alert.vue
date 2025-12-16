<template>
  <div v-if="message" class="p-4 mb-4 text-lg text-white bg-red-600 rounded-lg">
    {{ message }}
  </div>
</template>

<script setup>
defineProps(['message'])
</script>
