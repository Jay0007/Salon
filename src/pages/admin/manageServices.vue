<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="mb-10">
      <h1 class="text-2xl font-semibold text-gray-800">Manage Services</h1>
      <p class="text-sm text-gray-500 mt-1">
        Services appear exactly as customers see them while booking
      </p>
    </header>

    <!-- Add / Edit Service -->
    <section class="mb-14">
      <div
        class="relative rounded-3xl border border-gray-200 bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] p-8"
      >
        <!-- Header -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              {{ editingId ? 'Edit Service' : 'Add New Service' }}
            </h2>
          </div>

          <span class="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-600">
            Admin Control
          </span>
        </div>

        <!-- Form -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <!-- Service Name -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-gray-600"> Service Name </label>
            <input
              v-model.trim="form.name"
              placeholder="Bridal Makeup"
              class="h-12 rounded-xl border border-gray-200 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            />
          </div>

          <!-- Category -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-gray-600"> Category </label>
            <select
              v-model="form.category"
              class="h-12 rounded-xl border border-gray-200 px-4 text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            >
              <option value="" disabled>Select category</option>
              <option v-for="c in categories" :key="c" :value="c">
                {{ c }}
              </option>
            </select>
          </div>

          <!-- Price -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-gray-600"> Price (₹) </label>
            <input
              type="number"
              min="0"
              v-model.number="form.price"
              placeholder="2500"
              class="h-12 rounded-xl border border-gray-200 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            />
          </div>

          <!-- Duration -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-gray-600"> Duration (minutes) </label>
            <input
              type="number"
              min="5"
              step="5"
              v-model.number="form.duration"
              placeholder="90"
              class="h-12 rounded-xl border border-gray-200 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-10 flex items-center justify-end">
          <button
            @click="saveService"
            :disabled="saving"
            class="inline-flex items-center justify-center rounded-xl px-10 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? 'Saving…' : editingId ? 'Update Service' : 'Add Service' }}
          </button>
        </div>
      </div>
    </section>

    <!-- error rendring here  -->
    <p v-if="error" class="mt-4 text-sm text-red-600">
      {{ error }}
    </p>

    <!-- Services -->
    <section v-if="!loading" class="space-y-10">
      <div v-for="(group, category) in groupedServices" :key="category">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          {{ category }}
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="service in group"
            :key="service.id"
            class="bg-white border rounded-xl p-4 flex justify-between hover:shadow transition"
          >
            <!-- Info -->
            <div :class="!service.isActive && 'opacity-50'">
              <p class="font-medium text-gray-800">
                {{ service.name }}
              </p>
              <p class="text-sm text-gray-500 mt-1">{{ service.duration }} min</p>
            </div>

            <!-- Actions -->
            <div class="text-right">
              <p class="font-semibold text-indigo-600" :class="!service.isActive && 'opacity-50'">
                ₹{{ service.price }}
              </p>

              <div class="mt-2 flex gap-3 justify-end text-xs">
                <button
                  class="text-indigo-600 hover:underline"
                  :class="!service.isActive && 'opacity-50'"
                  @click="editService(service)"
                >
                  Edit
                </button>

                <button
                  class="hover:underline"
                  :class="service.isActive ? 'text-red-600' : 'text-green-600'"
                  @click="toggleStatus(service)"
                >
                  {{ service.isActive ? 'Disable' : 'Enable' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!services.length" class="text-center text-gray-400 text-sm">
        No services created yet
      </p>
    </section>

    <!-- Loading -->
    <p v-else class="text-center text-gray-400 text-sm">Loading services…</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  getAuth
} from '@/services/firebase'

/* ---------------- State ---------------- */

const services = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const categories = ['Hair', 'Makeup', 'Facial', 'Bridal', 'Nails']

const form = ref({
  name: '',
  category: '',
  price: null,
  duration: null
})

const editingId = ref(null)

/* ---------------- Computed ---------------- */

const groupedServices = computed(() => {
  const map = {}
  services.value.forEach((s) => {
    if (!map[s.category]) map[s.category] = []
    map[s.category].push(s)
    map[s.category].sort((a, b) => a.price - b.price)
  })
  return map
})

/* ---------------- Methods ---------------- */

async function loadServices() {
  loading.value = true
  services.value = []
  console.log('User UID:', getAuth().currentUser?.uid)
  const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)

  snap.forEach((d) => {
    services.value.push({ id: d.id, ...d.data() })
  })

  loading.value = false
}

async function saveService() {
  if (saving.value) return
  error.value = ''
  if (!form.value.name || !form.value.category || !form.value.price || !form.value.duration) {
    error.value = 'All fields are required'
    return
  }

  saving.value = true

  if (editingId.value) {
    await updateDoc(doc(db, 'services', editingId.value), form.value)
  } else {
    await addDoc(collection(db, 'services'), {
      ...form.value,
      isActive: true,
      createdAt: serverTimestamp()
    })
  }

  resetForm()
  await loadServices()
  saving.value = false
}

function editService(service) {
  editingId.value = service.id
  form.value = {
    name: service.name,
    category: service.category,
    price: service.price,
    duration: service.duration
  }
}

async function toggleStatus(service) {
  await updateDoc(doc(db, 'services', service.id), {
    isActive: !service.isActive
  })
  await loadServices()
}

function resetForm() {
  editingId.value = null
  error.value = ''
  form.value = {
    name: '',
    category: '',
    price: null,
    duration: null
  }
}

/* ---------------- Lifecycle ---------------- */

onMounted(loadServices)
</script>
