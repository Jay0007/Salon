<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="form-container">
      <h1 class="heading-primary">Welcome Back 👋</h1>
      <p class="heading-secondary">Please login to continue</p>
      <Alert v-if="error" :message="error" class="alert-error" />
      <form @submit.prevent="login" class="space-y-5">
        <div>
          <label class="form-label">Email</label>
          <BaseInput
            v-model="email"
            type="email"
            placeholder="your@email.com"
            autocomplete="email"
            class="form-input"
          />
        </div>
        <div>
          <label class="form-label">Password</label>
          <BaseInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="form-input"
          />
        </div>
        <BaseButton class="btn-primary">Login</BaseButton>
      </form>
      <p class="text-center text-sm text-gray-600 mt-6">
        Don't have an account?
        <router-link to="/register" class="link-primary hover:text-blue-900 hover:underline"
          >Register</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useRouter } from 'vue-router'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import Alert from '../components/Alert.vue'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const login = async () => {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message
  }
}
</script>
