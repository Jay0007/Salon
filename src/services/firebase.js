// services/firebase.js

// --- Firebase Core Imports ---
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
import { initializeApp, getApps, getApp } from 'firebase/app'

const app = getApps().length ? getApp() : initializeApp(config)
const auth = getAuth(app)
const db = getFirestore()
const functions = getFunctions(app, 'us-central1')

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence error:', err)
})

/* ======================================================
   BOOKING (TIMELINE-BASED)
====================================================== */

// ✅ CREATE BOOKING (NEW BACKEND)
async function createBooking({ timeline, bookingFor }) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const fn = httpsCallable(functions, 'createBooking')

  const result = await fn({
    timeline,
    bookingFor
  })

  return result.data
}

// ✅ RESCHEDULE BOOKING (TIMELINE-BASED)
async function rescheduleBooking({ bookingId, newTimeline }) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const fn = httpsCallable(functions, 'rescheduleBooking')

  const result = await fn({
    bookingId,
    newTimeline
  })

  return result.data
}

// ✅ CANCEL BOOKING (UNCHANGED)
async function cancelBooking(bookingId) {
  const fn = httpsCallable(functions, 'cancelBooking')
  return (await fn({ bookingId })).data
}

// ✅ FIND AVAILABLE TIMELINES
async function findAvailableTimelines({ date, serviceIds, preferredStaffMap }) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const fn = httpsCallable(functions, 'findAvailableTimelines')

  const result = await fn({
    date,
    serviceIds,
    preferredStaffMap
  })

  return result.data
}

/* ======================================================
   ADMIN / OTHER HELPERS (UNCHANGED)
====================================================== */

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
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

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

/* ======================================================
   EXPORTS
====================================================== */

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

  // Booking helpers (TIMELINE)
  createBooking,
  rescheduleBooking,
  cancelBooking,
  findAvailableTimelines,

  // Admin helpers
  createStaff,
  updateStaff,
  toggleStaffStatus,
  createService,
  updateService,
  toggleServiceStatus,
  getGlobalSettings
}
