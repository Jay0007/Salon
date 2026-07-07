<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Appointment History</h2>

        <p class="text-sm text-gray-500">View your previous and upcoming appointments.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="px-6 pt-5">
      <div class="inline-flex rounded-xl bg-gray-100 p-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="$emit('update:modelValue', tab.key)"
          class="rounded-lg px-5 py-2 text-sm font-medium transition-all"
          :class="
            modelValue === tab.key
              ? 'bg-white text-indigo-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          "
        >
          {{ tab.label }}

          <span class="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs">
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="space-y-4 p-6">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineEmits(['update:modelValue'])

defineProps({
  modelValue: String,
  tabs: Array
})
</script>
