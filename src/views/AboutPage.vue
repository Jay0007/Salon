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
        <p class="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">ABOUT US</p>

        <h1 class="mx-auto max-w-4xl text-5xl font-bold leading-tight text-gray-900 lg:text-6xl">
          Beauty That Brings Out
          <span class="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            Your Confidence
          </span>
        </h1>

        <p class="mx-auto mt-8 max-w-2xl text-lg leading-8 text-gray-600">
          At Radhe Beauty Makeover, every appointment is more than a service— it's a personalized
          beauty experience designed to help you look your best and feel even better.
        </p>

        <div class="mt-10 flex flex-wrap justify-center gap-5">
          <RouterLink
            to="/services"
            class="rounded-xl bg-rose-500 px-8 py-3 font-semibold text-white transition hover:bg-rose-600"
          >
            Explore Services
          </RouterLink>

          <RouterLink
            to="/booking"
            class="rounded-xl border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-800 transition hover:border-rose-300 hover:text-rose-600"
          >
            Book Appointment
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ================= STORY ================= -->

    <section class="py-24">
      <div class="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
        <!-- Left -->

        <div>
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">
            OUR STORY
          </p>

          <h2 class="text-4xl font-bold leading-tight text-gray-900">
            Passion, Precision & Professional Beauty Care
          </h2>

          <p class="mt-8 text-lg leading-8 text-gray-600">
            Radhe Beauty Makeover was founded with one simple goal—to create a salon where clients
            receive professional beauty services in a warm, relaxing, and welcoming environment.
          </p>

          <p class="mt-6 leading-8 text-gray-600">
            Whether you're visiting for a quick threading session, a complete bridal makeover, a
            luxury facial, or a refreshing haircut, our experienced professionals focus on quality,
            hygiene, and attention to detail in every service.
          </p>

          <p class="mt-6 leading-8 text-gray-600">
            We believe beauty isn't about changing who you are—it's about enhancing your natural
            confidence through expert care, premium products, and personalized recommendations.
          </p>
        </div>

        <!-- Right -->

        <div class="relative">
          <div
            class="overflow-hidden rounded-[32px] bg-gradient-to-br from-rose-100 via-white to-amber-100 p-10 shadow-xl"
          >
            <div class="flex aspect-square items-center justify-center rounded-3xl bg-white">
              <div class="text-center">
                <div class="text-8xl">💄</div>

                <h3 class="mt-6 text-3xl font-bold text-gray-900">Beauty with Care</h3>

                <p class="mx-auto mt-4 max-w-xs leading-7 text-gray-600">
                  Professional salon services delivered with modern techniques, quality products,
                  and genuine care for every client.
                </p>
              </div>
            </div>
          </div>

          <div class="absolute -left-8 -bottom-8 rounded-3xl bg-white p-6 shadow-xl">
            <p class="text-4xl font-bold text-rose-500">100%</p>

            <p class="mt-1 text-sm font-medium text-gray-600">Client Satisfaction</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= WHY CHOOSE US ================= -->

    <section class="bg-white py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">
            WHY CHOOSE US
          </p>

          <h2 class="mt-4 text-4xl font-bold text-gray-900">
            Everything You Need For A Luxury Salon Experience
          </h2>

          <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            From premium products to experienced professionals, every detail is focused on providing
            an exceptional salon experience.
          </p>
        </div>

        <div class="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4"></div>
        <!-- Card 1 -->

        <div
          class="group rounded-3xl border border-gray-100 bg-[#fcfaf8] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl">
            💄
          </div>

          <h3 class="mt-8 text-xl font-semibold text-gray-900">Certified Professionals</h3>

          <p class="mt-4 leading-7 text-gray-600">
            Experienced beauty experts committed to delivering quality services with precision and
            personalized attention.
          </p>
        </div>

        <!-- Card 2 -->

        <div
          class="group rounded-3xl border border-gray-100 bg-[#fcfaf8] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
            ✨
          </div>

          <h3 class="mt-8 text-xl font-semibold text-gray-900">Premium Products</h3>

          <p class="mt-4 leading-7 text-gray-600">
            We use trusted salon-quality brands that protect your skin and hair while delivering
            exceptional results.
          </p>
        </div>

        <!-- Card 3 -->

        <div
          class="group rounded-3xl border border-gray-100 bg-[#fcfaf8] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-3xl">
            🧖
          </div>

          <h3 class="mt-8 text-xl font-semibold text-gray-900">Hygienic Environment</h3>

          <p class="mt-4 leading-7 text-gray-600">
            Every tool and workstation is carefully sanitized to ensure a safe, comfortable and
            relaxing experience.
          </p>
        </div>

        <!-- Card 4 -->

        <div
          class="group rounded-3xl border border-gray-100 bg-[#fcfaf8] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div
            class="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl"
          >
            ❤️
          </div>

          <h3 class="mt-8 text-xl font-semibold text-gray-900">Personalized Care</h3>

          <p class="mt-4 leading-7 text-gray-600">
            Every recommendation is tailored to your skin, hair, lifestyle and personal preferences.
          </p>
        </div>
      </div>
    </section>

    <!-- ================= STATS ================= -->

    <section class="py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div
          class="overflow-hidden rounded-[36px] bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-2xl"
        >
          <div class="grid gap-10 px-8 py-14 text-center md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p class="text-5xl font-bold">5+</p>

              <p class="mt-3 uppercase tracking-[0.25em] text-rose-100">Years Experience</p>
            </div>

            <div>
              <p class="text-5xl font-bold">1000+</p>

              <p class="mt-3 uppercase tracking-[0.25em] text-rose-100">Happy Clients</p>
            </div>

            <div>
              <p class="text-5xl font-bold">20+</p>

              <p class="mt-3 uppercase tracking-[0.25em] text-rose-100">Beauty Services</p>
            </div>

            <div>
              <p class="text-5xl font-bold">★★★★★</p>

              <p class="mt-3 uppercase tracking-[0.25em] text-rose-100">Client Reviews</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= MISSION ================= -->

    <section class="bg-white py-24">
      <div class="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">
        <div class="rounded-[32px] bg-[#fcfaf8] p-10">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">OUR MISSION</p>

          <h2 class="mt-4 text-3xl font-bold text-gray-900">Inspiring Confidence Through Beauty</h2>

          <p class="mt-8 leading-8 text-gray-600">
            Our mission is to provide premium beauty services that enhance confidence, celebrate
            individuality, and create memorable salon experiences through professionalism,
            creativity, and exceptional customer care.
          </p>
        </div>

        <div class="rounded-[32px] bg-[#fcfaf8] p-10">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">OUR VISION</p>

          <h2 class="mt-4 text-3xl font-bold text-gray-900">
            Becoming Your Trusted Beauty Destination
          </h2>

          <p class="mt-8 leading-8 text-gray-600">
            We strive to become the preferred beauty destination by combining innovation, education,
            premium products, and outstanding service to exceed client expectations every single
            visit.
          </p>
        </div>
      </div>
    </section>
    <!-- ================= CALL TO ACTION ================= -->

    <section class="py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div
          class="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-8 py-16 text-center text-white shadow-2xl lg:px-20"
        >
          <div class="absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

          <div
            class="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          ></div>

          <div class="relative">
            <p class="text-sm font-semibold uppercase tracking-[0.35em] text-rose-100">
              READY FOR YOUR NEXT VISIT?
            </p>

            <h2 class="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight lg:text-5xl">
              Let Us Help You Look
              <br />
              & Feel Your Best.
            </h2>

            <p class="mx-auto mt-8 max-w-2xl text-lg leading-8 text-rose-50">
              Whether it's a fresh haircut, glowing facial, bridal makeover, hair coloring or a
              complete beauty transformation, our team is here to make every visit memorable.
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
                View Services
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= QUOTE ================= -->

    <section class="pb-24">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <svg class="mx-auto h-10 w-10 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M7.17 6A5.001 5.001 0 0 0 2 11v7h7v-7H5.08A3.001 3.001 0 0 1 7.17 8H9V6H7.17Zm10 0A5.001 5.001 0 0 0 12 11v7h7v-7h-3.92A3.001 3.001 0 0 1 17.17 8H19V6h-1.83Z"
          />
        </svg>

        <blockquote class="mt-8 text-3xl font-semibold leading-relaxed text-gray-900">
          "Beauty begins the moment you decide to care for yourself."
        </blockquote>

        <p class="mt-6 text-lg text-gray-500">
          We look forward to welcoming you to Radhe Beauty Makeover.
        </p>
      </div>
    </section>
  </div>
</template>
