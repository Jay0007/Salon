<!-- src/pages/HomePage.vue -->
<template>
  <div class="pt-0 bg-gray-50">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-indigo-600 to-purple-500 text-white">
      <div class="absolute inset-0 opacity-20 bg-[url('/hero-bg.jpg')] bg-cover bg-center"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
        <h1 class="text-5xl font-extrabold mb-4">Welcome to Glam of Sindoor</h1>
        <p class="text-lg mb-8">
          Where beauty meets passion. Discover our signature services today.
        </p>
        <BaseButton @click="$router.push('/Dashboard')" size="xl">Book Services</BaseButton>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="text-3xl font-bold text-gray-800 mb-8">Why to Choose Glam of Sindoor?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="space-y-4">
            <div class="text-indigo-600 text-4xl">💎</div>
            <h3 class="text-xl font-semibold">Premium Quality</h3>
            <p class="text-gray-600">
              We use only top-tier products and tools for your beauty needs.
            </p>
          </div>
          <div class="space-y-4">
            <div class="text-indigo-600 text-4xl">👩‍🎨</div>
            <h3 class="text-xl font-semibold">Expert Artists</h3>
            <p class="text-gray-600">
              Our stylists and technicians are trained in the latest techniques.
            </p>
          </div>
          <div class="space-y-4">
            <div class="text-indigo-600 text-4xl">🏆</div>
            <h3 class="text-xl font-semibold">Award Winning</h3>
            <p class="text-gray-600">
              Recognized for excellence in service and client satisfaction.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Signature Services (re-added) -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-8">Our Signature Services</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="svc in featured"
            :key="svc.id"
            class="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <img :src="svc.image" alt="" class="h-48 w-full object-cover" />
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-2">{{ svc.name }}</h3>
              <p class="text-gray-600 mb-4">{{ svc.description }}</p>
              <BaseButton
                @click="$router.push({ name: 'BookService', params: { id: svc.id } })"
                variant="outline"
              >
                Book Now — ${{ svc.price }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Preview -->
    <section class="py-16 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-8">Our Work Gallery</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <img
            src="../assets/hair.jpg"
            alt="Gallery Image"
            class="rounded-lg object-cover h-48 w-full"
          />
          <img
            src="./src/assets/henna.jpg"
            alt="Gallery Image"
            class="rounded-lg object-cover h-48 w-full"
          />
          <img
            src="./src/assets/henna.jpg"
            alt="Gallery Image"
            class="rounded-lg object-cover h-48 w-full"
          />
          <img
            src="./src/assets/henna.jpg"
            alt="Gallery Image"
            class="rounded-lg object-cover h-48 w-full"
          />
        </div>
      </div>
    </section>

    <!-- Pricing Packages -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-6xl mx-auto px-6 text-center">
        <h2 class="text-3xl font-bold text-gray-800 mb-8">Our Pricing Packages</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-2xl shadow-md space-y-4">
            <h3 class="text-2xl font-semibold">Basic</h3>
            <p class="text-indigo-600 text-4xl font-extrabold">$30</p>
            <ul class="space-y-2 text-gray-600">
              <li>Simple Henna Design</li>
              <li>Standard Manicure</li>
            </ul>
            <BaseButton variant="outline">Choose Basic</BaseButton>
          </div>
          <div class="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg space-y-4">
            <h3 class="text-2xl font-semibold">Premium</h3>
            <p class="text-4xl font-extrabold">$60</p>
            <ul class="space-y-2">
              <li>Intricate Henna Art</li>
              <li>Deluxe Manicure & Pedicure</li>
              <li>Express Hairstyling</li>
            </ul>
            <BaseButton>Choose Premium</BaseButton>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-md space-y-4">
            <h3 class="text-2xl font-semibold">Ultimate</h3>
            <p class="text-indigo-600 text-4xl font-extrabold">$90</p>
            <ul class="space-y-2 text-gray-600">
              <li>Full Henna Experience</li>
              <li>Luxury Mani & Pedi</li>
              <li>Custom Hairstyling</li>
            </ul>
            <BaseButton variant="outline">Choose Ultimate</BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Membership Plans (interactive) -->
    <section class="py-16 bg-white">
      <div class="max-w-6xl mx-auto px-6 text-center">
        <h2 class="text-3xl font-bold text-gray-800 mb-8">Membership Plans</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="plan in plans"
            :key="plan.id"
            @click="selectPlan(plan)"
            :class="[
              'cursor-pointer p-6 rounded-2xl shadow-md transition-transform duration-200',
              selected?.id === plan.id
                ? 'scale-105 shadow-lg ring-4 ring-indigo-100'
                : 'hover:scale-105 hover:shadow-lg'
            ]"
          >
            <h3 class="text-2xl font-semibold">{{ plan.name }}</h3>
            <p class="mt-2 mb-4">
              <span
                :class="plan.highlight ? 'text-white' : 'text-indigo-600'"
                class="text-4xl font-extrabold"
              >
                ${{ plan.price }}
              </span>
              <span class="text-lg font-normal">/mo</span>
            </p>
            <ul class="space-y-2 mb-6 text-gray-600">
              <li v-for="item in plan.features" :key="item">{{ item }}</li>
            </ul>
            <BaseButton
              :variant="plan.highlight ? 'primary' : 'outline'"
              @click.stop="selectPlan(plan)"
            >
              Subscribe
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ModalConfirm
        :show="modalVisible"
        :plan-name="selected?.name"
        :plan-price="selected?.price"
        @confirm="confirmSubscription"
        @cancel="modalVisible = false"
      />
    </section>

    <!-- Newsletter Signup -->
    <section class="py-16 bg-gradient-to-br from-indigo-600 to-purple-500 text-white">
      <div class="max-w-2xl mx-auto px-6 text-center">
        <h2 class="text-3xl font-bold mb-4">Stay in the Loop</h2>
        <p class="mb-6">Join our newsletter for exclusive offers and beauty tips.</p>
        <div class="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Your email address"
            class="flex-1 px-4 py-2 rounded-lg text-gray-800"
          />
          <BaseButton>Subscribe</BaseButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-8">
      <div class="max-w-6xl mx-auto px-6 text-center space-y-2">
        <p>© 2025 MySalon. All rights reserved.</p>
        <div class="space-x-4">
          <a href="#" class="hover:text-white">Privacy Policy</a>
          <a href="#" class="hover:text-white">Terms of Service</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import ModalConfirm from '@/components/ModalConfirm.vue'

const featured = ref([
  {
    id: 1,
    name: 'Bespoke Henna',
    description: 'Intricate, custom designs for every occasion.',
    price: 35,
    image: 'src/assets/henna.jpg'
  },
  {
    id: 2,
    name: 'Deluxe Manicure',
    description: 'Nail care and polish to perfection.',
    price: 30,
    image: 'src/assets/manicure.jpg'
  },
  {
    id: 3,
    name: 'Glam Hairstyling',
    description: 'Trendy cuts and elegant updos.',
    price: 50,
    image: 'src/assets/hair.jpg'
  }
])

const testimonials = ref([
  {
    name: 'Aisha K.',
    quote: 'Best salon experience I’ve ever had! The staff were so professional.'
  },
  {
    name: 'Maria L.',
    quote: 'My henna turned out more beautiful than I imagined—absolutely love it!'
  }
])
const plans = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 25,
    features: ['1 Service per Month', '5% Retail Discount'],
    highlight: false
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 50,
    features: ['2 Services per Month', '10% Retail Discount'],
    highlight: true // emphasize this middle plan
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 75,
    features: ['3 Services per Month', '15% Retail Discount', 'Priority Booking'],
    highlight: false
  }
]

const selected = ref(null)
const modalVisible = ref(false)

function selectPlan(plan) {
  selected.value = plan
  modalVisible.value = true
}

function confirmSubscription() {
  modalVisible.value = false
  // proceed to your subscription flow, e.g.:
  // router.push(`/subscribe/${selected.value.id}`)
  alert(`Subscribed to ${selected.value.name} plan!`)
}
</script>
