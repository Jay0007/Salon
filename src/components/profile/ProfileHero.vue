<template>
  <div
    class="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 shadow-lg"
  >
    <div class="p-8 text-white">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <!-- Left -->
        <div class="flex items-center gap-5">
          <!-- Avatar -->
          <div
            class="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-3xl font-bold backdrop-blur"
          >
            {{ initials }}
          </div>

          <!-- Info -->
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              {{ user.displayName || 'Guest User' }}
            </h1>

            <p class="mt-1 text-indigo-100">
              {{ user.email }}
            </p>

            <p v-if="phone" class="mt-1 text-indigo-100">
              {{ phone }}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-white/20 px-3 py-1 text-sm">
                Member since {{ memberSince }}
              </span>

              <span class="rounded-full bg-emerald-500/80 px-3 py-1 text-sm">
                Active Customer
              </span>
            </div>
          </div>
        </div>

        <!-- Right -->
        <div class="flex gap-3">
          <button
            class="rounded-xl bg-white px-5 py-2.5 font-medium text-indigo-700 transition hover:bg-gray-100"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  },

  phone: {
    type: String,
    default: ''
  },

  memberSince: {
    type: String,
    default: ''
  }
})

const initials = computed(() => {
  const name = props.user?.displayName || ''

  if (!name) return '?'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
})
</script>
