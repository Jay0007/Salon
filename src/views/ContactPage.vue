<template>
  <div class="min-h-screen bg-[#fcfaf8]">
    <!-- ================= HERO ================= -->

    <section
      class="relative overflow-hidden bg-gradient-to-r from-[#fffaf8] via-white to-[#fffdf8]"
    >
      <div class="absolute inset-0 opacity-30">
        <div class="absolute -left-40 top-0 h-96 w-96 rounded-full bg-rose-100 blur-3xl"></div>
        <div class="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-amber-100 blur-3xl"></div>
      </div>

      <div class="relative mx-auto max-w-6xl px-6 py-16 text-center lg:py-24">
        <p class="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">
          CONTACT US
        </p>

        <h1 class="mx-auto max-w-4xl text-5xl font-bold leading-tight text-gray-900 lg:text-6xl">
          We'd Love To
          <span class="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            Hear From You
          </span>
        </h1>

        <p class="mx-auto mt-8 max-w-2xl text-lg leading-8 text-gray-600">
          Whether you're ready to book an appointment, have questions about our services, or simply
          want beauty advice, we're always happy to help.
        </p>

        <div class="mt-10 flex flex-wrap justify-center gap-5">
          <RouterLink
            to="/booking"
            class="rounded-xl bg-rose-500 px-8 py-3 font-semibold text-white transition hover:bg-rose-600"
          >
            Book Appointment
          </RouterLink>

          <a
            href="tel:+11234567890"
            class="rounded-xl border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-800 transition hover:border-rose-300 hover:text-rose-600"
          >
            Call Now
          </a>
        </div>
      </div>
    </section>

    <!-- ================= CONTACT CARDS ================= -->

    <section class="py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div class="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <!-- Phone -->

          <div
            class="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl"
            >
              📞
            </div>

            <h3 class="mt-8 text-xl font-semibold text-gray-900">Call Us</h3>

            <p class="mt-4 text-gray-600">+1 (905) 123-4567</p>

            <p class="mt-2 text-sm text-gray-500">Mon - Sat</p>
          </div>

          <!-- Email -->

          <div
            class="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl"
            >
              ✉️
            </div>

            <h3 class="mt-8 text-xl font-semibold text-gray-900">Email</h3>

            <p class="mt-4 break-all text-gray-600">info@radhebeautymakeover.ca</p>

            <p class="mt-2 text-sm text-gray-500">Response within 24 hours</p>
          </div>

          <!-- Address -->

          <div
            class="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-3xl"
            >
              📍
            </div>

            <h3 class="mt-8 text-xl font-semibold text-gray-900">Visit Us</h3>

            <p class="mt-4 text-gray-600">Milton, Ontario</p>

            <p class="mt-2 text-sm text-gray-500">Canada</p>
          </div>

          <!-- Hours -->

          <div
            class="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl"
            >
              🕒
            </div>

            <h3 class="mt-8 text-xl font-semibold text-gray-900">Opening Hours</h3>

            <p class="mt-4 text-gray-600">Mon - Sat</p>

            <p class="mt-2 text-sm text-gray-500">10:00 AM – 8:00 PM</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CONTACT FORM ================= -->

    <section class="bg-white py-24">
      <div class="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">
        <!-- Left -->

        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">
            SEND A MESSAGE
          </p>

          <h2 class="mt-4 text-4xl font-bold text-gray-900">Get In Touch</h2>

          <p class="mt-8 text-lg leading-8 text-gray-600">
            Fill out the form and we'll get back to you as soon as possible. Whether it's a booking
            inquiry or a question about our services, we're here to help.
          </p>
        </div>

        <!-- Right -->

        <div>
          <form
            @submit.prevent="submit"
            class="space-y-6 rounded-[32px] bg-[#fcfaf8] p-8 shadow-sm"
          >
            <div class="grid gap-6 md:grid-cols-2">
              <div>
                <label class="mb-2 block font-medium text-gray-700"> Full Name </label>

                <input
                  v-model="form.fullName"
                  type="text"
                  placeholder="John Doe"
                  class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400"
                />
              </div>

              <div>
                <label class="mb-2 block font-medium text-gray-700"> Phone Number </label>

                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+1 (905) 123-4567"
                  class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400"
                />
              </div>
            </div>

            <div>
              <label class="mb-2 block font-medium text-gray-700"> Email Address </label>

              <input
                v-model="form.email"
                type="email"
                placeholder="you@example.com"
                class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400"
              />
            </div>

            <div>
              <label class="mb-2 block font-medium text-gray-700"> Interested Service </label>

              <select
                v-model="form.service"
                class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400"
              >
                <option>Select a service</option>
                <option>Haircut</option>
                <option>Hair Color</option>
                <option>Hair Spa</option>
                <option>Facial</option>
                <option>Waxing</option>
                <option>Threading</option>
                <option>Bridal Makeup</option>
                <option>Party Makeup</option>
                <option>Henna</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label class="mb-2 block font-medium text-gray-700"> Message </label>

              <textarea
                v-model="form.message"
                rows="6"
                placeholder="Tell us how we can help..."
                class="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400"
              ></textarea>
            </div>

            <button
              :disabled="loading"
              type="submit"
              class="w-full rounded-xl bg-rose-500 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ loading ? 'Sending...' : 'Send Message' }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- ================= BUSINESS HOURS ================= -->

    <section class="py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div class="grid gap-10 lg:grid-cols-2">
          <div class="rounded-[32px] bg-white p-10 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">
              BUSINESS HOURS
            </p>

            <h2 class="mt-4 text-3xl font-bold text-gray-900">Visit Us Anytime</h2>

            <div class="mt-10 space-y-5">
              <div class="flex justify-between border-b pb-3">
                <span>Monday</span>
                <span>10:00 AM - 8:00 PM</span>
              </div>

              <div class="flex justify-between border-b pb-3">
                <span>Tuesday</span>
                <span>10:00 AM - 8:00 PM</span>
              </div>

              <div class="flex justify-between border-b pb-3">
                <span>Wednesday</span>
                <span>10:00 AM - 8:00 PM</span>
              </div>

              <div class="flex justify-between border-b pb-3">
                <span>Thursday</span>
                <span>10:00 AM - 8:00 PM</span>
              </div>

              <div class="flex justify-between border-b pb-3">
                <span>Friday</span>
                <span>10:00 AM - 8:00 PM</span>
              </div>

              <div class="flex justify-between border-b pb-3">
                <span>Saturday</span>
                <span>10:00 AM - 8:00 PM</span>
              </div>

              <div class="flex justify-between font-semibold">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>

          <div class="rounded-[32px] bg-gradient-to-br from-rose-500 to-pink-500 p-10 text-white">
            <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-100">FOLLOW US</p>

            <h2 class="mt-4 text-3xl font-bold">Stay Connected</h2>

            <p class="mt-6 leading-8 text-rose-50">
              Follow us for beauty tips, special offers, new services, transformations, and
              behind-the-scenes moments from the salon.
            </p>

            <div class="mt-10 space-y-4">
              <a
                href="#"
                class="flex items-center justify-between rounded-xl bg-white/10 px-5 py-4 backdrop-blur transition hover:bg-white/20"
              >
                <span>Instagram</span>
                <span>→</span>
              </a>

              <a
                href="#"
                class="flex items-center justify-between rounded-xl bg-white/10 px-5 py-4 backdrop-blur transition hover:bg-white/20"
              >
                <span>Facebook</span>
                <span>→</span>
              </a>

              <a
                href="#"
                class="flex items-center justify-between rounded-xl bg-white/10 px-5 py-4 backdrop-blur transition hover:bg-white/20"
              >
                <span>Google Business</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- ================= MAP ================= -->

    <section class="bg-white py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div class="mb-12 text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">FIND US</p>

          <h2 class="mt-4 text-4xl font-bold text-gray-900">Visit Our Salon</h2>

          <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Conveniently located in Milton, Ontario. We look forward to welcoming you to our salon.
          </p>
        </div>

        <div class="overflow-hidden rounded-[32px] shadow-xl">
          <!-- Replace src with your own Google Maps embed -->

          <iframe
            class="h-[500px] w-full border-0"
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb="
          ></iframe>
        </div>
      </div>
    </section>

    <!-- ================= FAQ ================= -->

    <section class="py-24">
      <div class="mx-auto max-w-5xl px-6">
        <div class="text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">
            FREQUENTLY ASKED QUESTIONS
          </p>

          <h2 class="mt-4 text-4xl font-bold text-gray-900">Need More Information?</h2>
        </div>

        <div class="mt-14 space-y-6">
          <div class="rounded-3xl bg-white p-8 shadow-sm">
            <h3 class="text-xl font-semibold text-gray-900">Do I need an appointment?</h3>

            <p class="mt-4 leading-8 text-gray-600">
              Appointments are recommended to ensure availability, but walk-ins are welcome whenever
              possible.
            </p>
          </div>

          <div class="rounded-3xl bg-white p-8 shadow-sm">
            <h3 class="text-xl font-semibold text-gray-900">
              Which payment methods do you accept?
            </h3>

            <p class="mt-4 leading-8 text-gray-600">
              We accept cash, debit cards, credit cards, and other supported digital payment
              methods.
            </p>
          </div>

          <div class="rounded-3xl bg-white p-8 shadow-sm">
            <h3 class="text-xl font-semibold text-gray-900">Can I reschedule my appointment?</h3>

            <p class="mt-4 leading-8 text-gray-600">
              Yes. Please contact us as early as possible so we can help you choose another
              convenient time.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CTA ================= -->

    <section class="pb-24">
      <div class="mx-auto max-w-7xl px-6">
        <div
          class="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-8 py-16 text-center text-white shadow-2xl lg:px-20"
        >
          <div class="absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

          <div
            class="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          ></div>

          <div class="relative">
            <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-100">
              READY TO BOOK?
            </p>

            <h2 class="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight lg:text-5xl">
              Your Beauty Journey Starts Here
            </h2>

            <p class="mx-auto mt-8 max-w-2xl text-lg leading-8 text-rose-50">
              Schedule your appointment today and experience personalized beauty services delivered
              with care, professionalism, and attention to every detail.
            </p>

            <div class="mt-12 flex flex-wrap justify-center gap-5">
              <RouterLink
                to="/booking"
                class="rounded-xl bg-white px-8 py-3 font-semibold text-rose-600 transition hover:scale-105"
              >
                Book Appointment
              </RouterLink>

              <RouterLink
                to="/services"
                class="rounded-xl border border-white/40 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Browse Services
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref } from 'vue'

import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

const submitContactForm = httpsCallable(functions, 'submitContactForm')

const loading = ref(false)

const form = ref({
  fullName: '',

  phone: '',

  email: '',

  service: '',

  message: ''
})

async function submit() {
  try {
    loading.value = true

    await submitContactForm(form.value)

    alert("Thank you! We'll contact you soon.")

    form.value = {
      fullName: '',

      phone: '',

      email: '',

      service: '',

      message: ''
    }
  } catch (err) {
    alert(err.message)
  } finally {
    loading.value = false
  }
}
</script>
