<template>
  <div class="min-h-screen bg-gradient-to-b from-[#fffdfb] via-rose-50/30 to-stone-100">
    <!-- Hero -->
    <section
      class="relative overflow-hidden bg-gradient-to-r from-[#fffaf8] via-white to-[#fffdf8]"
    >
      <div class="absolute inset-0 opacity-10">
        <div class="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-rose-300 blur-3xl"></div>

        <div class="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-300 blur-3xl"></div>
      </div>

      <div class="relative mx-auto max-w-6xl px-6 py-14 lg:py-20 text-center">
        <p
          class="mb-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-rose-600 shadow"
        >
          ✨ Professional Beauty Services
        </p>

        <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
          Discover Your
          <span class="text-rose-600"> Perfect Look </span>
        </h1>

        <p class="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-600">
          Experience premium beauty services from skilled professionals. Whether it's a haircut,
          bridal makeup, facial, waxing or henna, we're here to help you look and feel your best.
        </p>

        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <RouterLink
            to="/book"
            class="rounded-xl bg-rose-600 px-7 py-3.5 font-medium text-white transition hover:bg-rose-700"
          >
            Book Appointment
          </RouterLink>

          <RouterLink
            to="/contact"
            class="rounded-xl border border-gray-300 bg-white px-7 py-3.5 font-medium text-gray-700 transition hover:border-rose-600 hover:text-rose-600"
          >
            Contact Us
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Search -->

    <section class="relative z-20 mx-auto -mt-8 max-w-5xl px-6">
      <div class="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-2xl p-6">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Search services..."
            class="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 shadow-sm hover:shadow-xl outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
          />

          <svg
            class="absolute left-4 top-4 h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-5-5m2-5a7 7 0 11-14 0a7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </section>

    <!-- Category Pills -->

    <section class="mx-auto max-w-7xl px-6 py-10">
      <div class="flex gap-3 overflow-x-auto pb-2">
        <button
          @click="selectedCategory = 'All'"
          :class="[
            selectedCategory === 'All'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm '
              : 'bg-white text-gray-700 shadow-md',
            'rounded-full px-5 py-2.5 font-medium transition-all duration-300 shadow-sm hover:shadow-md'
          ]"
        >
          All Services
        </button>

        <button
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category"
          :class="[
            selectedCategory === category
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
              : 'bg-white text-gray-700 shadow-sm',
            'rounded-full px-5 py-2.5 font-medium transition-all duration-300 shadow-md hover:shadow-md'
          ]"
        >
          {{ category }}
        </button>
      </div>
    </section>

    <!-- Services -->

    <section class="mx-auto max-w-7xl px-6 pb-24">
      <!-- Loading -->

      <div v-if="loading" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="i in 6" :key="i" class="animate-pulse rounded-3xl bg-white p-6 shadow">
          <div class="mb-6 h-12 w-12 rounded-2xl bg-gray-200"></div>

          <div class="mb-3 h-6 rounded bg-gray-200"></div>

          <div class="mb-8 h-4 w-3/4 rounded bg-gray-100"></div>

          <div class="mb-2 h-4 w-24 rounded bg-gray-200"></div>

          <div class="mb-6 h-4 w-20 rounded bg-gray-200"></div>

          <div class="h-11 rounded-xl bg-gray-200"></div>
        </div>
      </div>

      <!-- Empty -->

      <div
        v-else-if="filteredCategories.length === 0"
        class="rounded-3xl bg-white py-24 text-center shadow"
      >
        <div class="mb-5 text-5xl">🔍</div>

        <h2 class="text-2xl font-bold text-gray-800">No services found</h2>

        <p class="mt-3 text-gray-500">Try searching for something else.</p>
      </div>

      <!-- Categories -->

      <div v-else class="space-y-15">
        <section v-for="category in filteredCategories" :key="category">
          <div class="mb-10">
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Services</p>

            <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {{ category }}
            </h2>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="service in filteredServicesByCategory(category)"
              :key="service.id"
              class="group relative overflow-hidden rounded-3xl border border-rose-100 bg-white transition duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl"
            >
              <!-- Image -->

              <div
                class="relative h-36 overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50"
              >
                <div
                  class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.9),transparent_50%)]"
                ></div>

                <div
                  class="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/40 blur-3xl"
                ></div>

                <div
                  class="absolute inset-0 flex items-center justify-center text-5xl transition duration-500 group-hover:scale-110"
                >
                  {{ categoryIcon(category) }}
                </div>

                <div class="absolute top-4 right-4 rounded-full bg-white px-4 py-2 shadow-md">
                  <p class="text-[11px] uppercase tracking-widest text-gray-400">From</p>

                  <p class="text-lg font-bold text-rose-600">₹{{ service.price }}</p>
                </div>
              </div>

              <!-- Body -->

              <div class="space-y-5 p-5">
                <div>
                  <div class="mb-3 flex items-center gap-2">
                    <span
                      class="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-rose-600"
                    >
                      {{ category }}
                    </span>

                    <!-- <span
                      class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                    >
                      Premium
                    </span> -->
                  </div>

                  <h3 class="text-xl font-bold text-gray-900">
                    {{ service.name }}
                  </h3>

                  <!-- <p class="mt-3 leading-7 text-gray-500">
                    Personalized beauty treatment performed using premium products and professional
                    techniques for beautiful, long-lasting results.
                  </p> -->
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div
                    class="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm"
                  >
                    <div class="flex items-center gap-2 text-gray-600">
                      ⏱ {{ service.duration }} mins
                    </div>
                    <div class="font-medium text-gray-800">Expert Care</div>
                  </div>
                </div>

                <RouterLink
                  to="/book"
                  class="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 text-base font-medium text-white transition duration-300 hover:scale-[1.02] hover:from-rose-600 hover:to-pink-600"
                >
                  Book Appointment

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 transition group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useServicesStore } from '@/stores/services'

const servicesStore = useServicesStore()

const { services, loading } = storeToRefs(servicesStore)

const search = ref('')
const selectedCategory = ref('All')

onMounted(async () => {
  await servicesStore.fetchServices()

  console.log('Services:', services.value)
})

const categories = computed(() => {
  return [...new Set(services.value.map((s) => s.category))].sort()
})

const filteredServices = computed(() => {
  return services.value.filter((service) => {
    if (!service.isActive) return false

    const matchesCategory =
      selectedCategory.value === 'All' || service.category === selectedCategory.value

    const keyword = search.value.trim().toLowerCase()

    const matchesSearch =
      keyword === '' ||
      service.name.toLowerCase().includes(keyword) ||
      service.category.toLowerCase().includes(keyword)

    return matchesCategory && matchesSearch
  })
})

const filteredCategories = computed(() => {
  return [...new Set(filteredServices.value.map((service) => service.category))]
})

function filteredServicesByCategory(category) {
  return filteredServices.value.filter((service) => service.category === category)
}

function categoryIcon(category) {
  const icons = {
    Hair: '✂️',

    Makeup: '💄',

    Facial: '✨',

    Waxing: '🪒',

    Threading: '🧵',

    Henna: '🌿',

    Nails: '💅',

    Spa: '🧖',

    Massage: '💆',

    Bridal: '👰'
  }

  return icons[category] ?? '💖'
}
</script>
