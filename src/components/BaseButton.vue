<!-- src/components/BaseButton.vue -->
<template>
  <button :class="classes" v-bind="otherAttrs">
    <slot />
  </button>
</template>

<script setup>
import { computed, useAttrs } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' }
})

const { variant, size } = props
const attrs = useAttrs()

// Base classes applied to every button
const baseClasses = 'font-semibold rounded-lg transition duration-550'

// Map of variants → Tailwind classes
const variantClasses = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
}

// Map of sizes → Tailwind padding/text classes
const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
  xl: 'px-20 py-5 text-2xl'
}

// Compute the final class list, pulling in any classes passed via the normal `class="..."` attribute
const classes = computed(() => {
  return [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    attrs.class // this grabs whatever you wrote in `class="..."`
  ]
    .filter(Boolean) // remove any undefined
    .join(' ')
})

// Separate out everything except class so we can v-bind the rest
const { class: _discard, ...otherAttrs } = attrs
</script>
