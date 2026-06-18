<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="form-container">
      <h1 class="heading-primary">Create Account 🚀</h1>
      <p class="heading-secondary">Join us today</p>
      <Alert v-if="error" :message="error" class="alert-error" />
      <form @submit.prevent="register" class="space-y-5">
        <div>
          <label class="form-label">Display Name</label>
          <BaseInput
            v-model="displayName"
            type="text"
            placeholder="jon doe"
            autocomplete="username"
            class="form-input"
          />
        </div>
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
            autocomplete="new-password"
            class="form-input"
          />
        </div>
        <BaseButton class="btn-primary">Register</BaseButton>
      </form>
      <p class="text-center text-sm text-gray-600 mt-6">
        Already have an account? <router-link to="/login" class="link-primary">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, updateProfile } from '../services/firebase'
import { useRouter } from 'vue-router'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import Alert from '../components/Alert.vue'

const email = ref('')
const password = ref('')
const displayName = ref('')
const error = ref('')
const router = useRouter()

const register = async () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Email and password are required.'
    return
  }
  if (!displayName.value) {
    error.value = 'Full name is required.'
    return
  }

  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value).then(
      (user) => {
        return updateProfile(auth.currentUser, { displayName: displayName.value })
      },
      (error) => {
        alert(error.message)
      }
    )
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message
    console.error(err)
  }
}
</script>
