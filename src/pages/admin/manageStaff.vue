<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="mb-10">
      <h1 class="text-2xl font-semibold text-gray-800">Manage Staff</h1>
      <p class="text-sm text-gray-500 mt-1">
        Create staff members and assign services they can perform
      </p>
    </header>

    <!-- Add Staff -->
    <section class="bg-white border rounded-2xl shadow-sm p-6 mb-12">
      <h2 class="text-lg font-semibold mb-6 text-gray-700">
        {{ editingId ? 'Edit Staff Member' : 'Add Staff Member' }}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"> Staff Name </label>
          <input
            v-model.trim="form.name"
            class="w-full h-11 rounded-xl border px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g. Riya"
          />
        </div>

        <!-- Status -->
        <div class="flex items-end">
          <label class="inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" v-model="form.isActive" />
            Active
          </label>
        </div>
      </div>

      <!-- Services -->
      <div class="mt-6">
        <p class="text-sm font-medium text-gray-600 mb-2">Services this staff can perform</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <label
            v-for="s in services"
            :key="s.id"
            class="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
          >
            <input type="checkbox" :value="s.id" v-model="form.services" />
            <span class="text-sm text-gray-700">
              {{ s.name }}
            </span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 flex justify-end gap-3">
        <button v-if="editingId" @click="resetForm" class="px-6 py-2 border rounded-lg text-sm">
          Cancel
        </button>

        <button
          @click="saveStaff"
          :disabled="saving"
          class="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ saving ? 'Saving…' : editingId ? 'Update Staff' : 'Add Staff' }}
        </button>
      </div>
    </section>
    <section>
      <p v-if="error" class="mt-4 text-sm text-red-600">
        {{ error }}
      </p>
    </section>

    <!-- Staff List -->
    <section>
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Staff Members</h3>

      <div v-if="!staff.length" class="text-sm text-gray-400">No staff created yet</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="member in staff"
          :key="member.id"
          class="bg-white border rounded-xl p-5 flex justify-between items-start"
        >
          <div>
            <p class="font-medium text-gray-800">
              {{ member.name }}
            </p>

            <p class="text-xs text-gray-500 mt-1">
              {{ member.isActive ? 'Active' : 'Disabled' }}
            </p>

            <div class="mt-3 text-xs text-gray-600">
              <span
                v-for="sid in member.services"
                :key="sid"
                class="inline-block mr-2 mb-1 px-2 py-1 bg-gray-100 rounded"
              >
                {{ serviceName(sid) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs text-gray-500">Admin</span>
            <input type="checkbox" :checked="member.isAdmin" @change="toggleAdmin(member)" />
          </div>

          <div class="flex flex-col gap-2 text-sm">
            <button class="text-indigo-600 hover:underline" @click="editStaff(member)">Edit</button>

            <button
              class="hover:underline"
              :class="member.isActive ? 'text-red-600' : 'text-green-600'"
              @click="toggleStatus(member)"
            >
              {{ member.isActive ? 'Disable' : 'Enable' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  db,
  collection,
  getDocs,
  createStaff,
  updateStaff,
  toggleStaffStatus
} from '@/services/firebase'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'
/* ---------------- State ---------------- */

const services = ref([])
const staff = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = ref({
  name: '',
  isActive: true,
  services: []
})

const editingId = ref(null)

const setStaffAdmin = httpsCallable(functions, 'setStaffAdmin')

async function toggleAdmin(member) {
  if (!member.userId) {
    alert('Staff must have an account to become admin')
    return
  }

  try {
    await setStaffAdmin({
      userId: member.userId,
      staffId: member.id,
      makeAdmin: !member.isAdmin
    })

    member.isAdmin = !member.isAdmin
  } catch (err) {
    alert(err.message || 'Failed to update admin role')
  }
}

/* ---------------- Load Data ---------------- */

async function loadServices() {
  services.value = []
  const snap = await getDocs(collection(db, 'services'))
  snap.forEach((d) => {
    const data = d.data()
    if (data.isActive) services.value.push({ id: d.id, ...data })
  })
}

async function loadStaff() {
  staff.value = []
  const snap = await getDocs(collection(db, 'staff'))
  snap.forEach((d) => staff.value.push({ id: d.id, ...d.data() }))
}

/* ---------------- Actions ---------------- */

async function saveStaff() {
  if (saving.value) return
  error.value = ''

  if (!form.value.name || !form.value.services.length) {
    error.value = 'Staff name and at least one service is required'
    return
  }

  saving.value = true

  try {
    if (editingId.value) {
      await updateStaff({
        staffId: editingId.value,
        name: form.value.name,
        services: form.value.services,
        isActive: form.value.isActive
      })
    } else {
      await createStaff({
        name: form.value.name,
        services: form.value.services,
        isActive: form.value.isActive
      })
    }

    resetForm()
    await loadStaff()
  } catch (e) {
    error.value = e.message || 'Failed to save staff'
  } finally {
    saving.value = false
  }
}

function editStaff(member) {
  editingId.value = member.id
  form.value = {
    name: member.name,
    isActive: member.isActive,
    services: [...member.services]
  }
}

async function toggleStatus(member) {
  if (!confirm(`Are you sure you want to ${member.isActive ? 'disable' : 'enable'} this staff?`))
    return

  await toggleStaffStatus({
    staffId: member.id,
    isActive: !member.isActive
  })

  await loadStaff()
}

function resetForm() {
  editingId.value = null
  error.value = ''
  form.value = {
    name: '',
    isActive: true,
    services: []
  }
}

function serviceName(id) {
  return services.value.find((s) => s.id === id)?.name || 'Unknown'
}

/* ---------------- Lifecycle ---------------- */

onMounted(async () => {
  loading.value = true
  await loadServices()
  await loadStaff()
  loading.value = false
})
</script>
