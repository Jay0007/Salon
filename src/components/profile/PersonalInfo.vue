<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Personal Information</h2>

        <p class="text-sm text-gray-500">Your account details</p>
      </div>

      <button
        class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Edit
      </button>
    </div>

    <div class="divide-y">
      <InfoRow label="Full Name" :value="user.displayName || '-'" />

      <InfoRow label="Email" :value="user.email || '-'" />

      <InfoRow label="Phone" :value="phone || 'Not provided'" />

      <InfoRow label="Member Since" :value="memberSince" />

      <InfoRow label="Account Status" value="Active" />
    </div>
  </div>
</template>

<script setup>
import InfoRow from './ProfileInfoRow.vue'

defineProps({
  user: Object,
  phone: String,
  memberSince: String
})
</script>
