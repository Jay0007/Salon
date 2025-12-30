// services/firebase.js

// --- Firebase Core Imports ---
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  sendEmailVerification,
  applyActionCode,
  deleteUser,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  RecaptchaVerifier
} from 'firebase/auth'

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'

import { getFunctions, httpsCallable } from 'firebase/functions'

// --- Firebase Configuration ---
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// --- Initialize Firebase App ---
const app = initializeApp(config)
const auth = getAuth(app)
const db = getFirestore()
const functions = getFunctions(app, 'us-central1')

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence error:', err)
})

// --- Booking Helpers ---
async function refreshTokenIfNeeded() {
  if (!auth.currentUser) throw new Error('Not authenticated')
  await auth.currentUser.getIdToken(true)
}

// --- Booking via Cloud Function ---
async function createBooking({ serviceId, startAt, endAt }) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const fn = httpsCallable(functions, 'createBooking')

  const result = await fn({
    serviceId,
    startAt,
    endAt
  })

  return result.data
}

// Cancel a booking
async function cancelBooking(bookingId) {
  const bookingRef = doc(db, 'bookings', bookingId)
  return updateDoc(bookingRef, { status: 'cancelled' })
}

// Reschedule a booking
async function rescheduleBooking({ bookingId, newStartAt, newEndAt }) {
  const fn = httpsCallable(functions, 'rescheduleBooking')
  return (await fn({ bookingId, newStartAt, newEndAt })).data
}

async function createStaff(data) {
  const fn = httpsCallable(functions, 'createStaff')
  return (await fn(data)).data
}

async function updateStaff(data) {
  const fn = httpsCallable(functions, 'updateStaff')
  return (await fn(data)).data
}
async function createService(data) {
  const fn = httpsCallable(functions, 'createService')
  return (await fn(data)).data
}

async function updateService(data) {
  const fn = httpsCallable(functions, 'updateService')
  return (await fn(data)).data
}

async function toggleServiceStatus(data) {
  await refreshTokenIfNeeded()
  const fn = httpsCallable(functions, 'toggleServiceStatus')
  return (await fn(data)).data
}

async function toggleStaffStatus(data) {
  const fn = httpsCallable(functions, 'toggleStaffStatus')
  return (await fn(data)).data
}

async function getGlobalSettings() {
  const snap = await getDoc(doc(db, 'settings', 'global'))
  if (!snap.exists()) {
    throw new Error('Global settings not configured')
  }
  return snap.data()
}

// --- Exports ---
export {
  app,
  functions,
  auth,
  db,
  getAuth,
  // Firestore core
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,

  // Auth core
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification,
  applyActionCode,
  deleteUser,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,

  // Booking helpers
  // addBooking,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  createService,
  updateService,
  toggleServiceStatus,
  getGlobalSettings
}
