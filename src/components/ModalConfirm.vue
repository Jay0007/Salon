<!-- src/components/ModalConfirm.vue -->
<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
      <h2 class="text-xl font-bold mb-4">Confirm Subscription</h2>
      <p class="mb-6">
        You’re about to subscribe to <strong>{{ planName }}</strong> at
        <strong>{{ planPrice }}/mo</strong>.
      </p>
      <div class="flex justify-end space-x-4">
        <button @click="$emit('cancel')" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
          Cancel
        </button>
        <button
          @click="$emit('confirm')"
          class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  planName: String,
  planPrice: [String, Number]
})
</script>
