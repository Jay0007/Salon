<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm bg-white rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold text-gray-800 text-center mb-2">Sign in</h2>
      <p class="text-sm text-gray-500 text-center mb-6">Continue with your phone number</p>

      <!-- Phone input -->
      <div v-if="step === 'phone'">
        <input
          v-model="phone"
          class="w-full border rounded-lg px-4 py-3 mb-4"
          placeholder="+91XXXXXXXXXX"
        />

        <button
          @click="sendOtp"
          class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium"
        >
          Continue
        </button>
      </div>

      <!-- OTP input -->
      <div v-if="step === 'otp'">
        <input
          v-model="otp"
          class="w-full border rounded-lg px-4 py-3 mb-4"
          placeholder="Enter OTP"
        />

        <button
          @click="verifyOtp"
          class="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
        >
          Verify
        </button>
      </div>

      <!-- Name input (first-time users) -->
      <div v-if="step === 'name'">
        <input
          v-model="name"
          class="w-full border rounded-lg px-4 py-3 mb-4"
          placeholder="Your full name"
        />

        <button
          @click="saveUser"
          class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium"
        >
          Finish
        </button>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  auth,
  updateProfile,
  getDoc,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from '../services/firebase'
import { useRouter } from 'vue-router'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import Alert from '../components/Alert.vue'
const router = useRouter()

let confirmationResult
let recaptchaVerifier

const phone = ref('')
const otp = ref('')
const name = ref('')
const step = ref('phone')

onMounted(() => {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible'
  })
})

async function sendOtp() {
  const confirmation = await signInWithPhoneNumber(auth, phone.value, window.recaptchaVerifier)

  confirmationResult = confirmation
  step.value = 'otp'
}

async function verifyOtp() {
  const result = await confirmationResult.confirm(otp.value)
  const user = result.user

  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  if (snap.exists()) {
    router.push('/profile')
  } else {
    step.value = 'name'
  }
}

async function saveUser() {
  const user = auth.currentUser

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    phone: phone.value,
    name: name.value,
    role: 'customer',
    phoneVerified: true,
    createdAt: serverTimestamp()
  })
}
</script>
