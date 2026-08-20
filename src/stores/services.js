import { defineStore } from 'pinia'
import { ref } from 'vue'

import { db, collection, getDocs, query, orderBy } from '@/services/firebase'

export const useServicesStore = defineStore('services', () => {
  const services = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  async function fetchServices(force = false) {
    if (loaded.value && !force) return

    loading.value = true

    try {
      services.value = []

      const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'))

      const snap = await getDocs(q)

      snap.forEach((d) => {
        services.value.push({
          id: d.id,
          ...d.data()
        })
      })

      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  return {
    services,
    loading,
    loaded,

    fetchServices
  }
})
