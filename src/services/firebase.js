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

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence error:', err)
})

// --- Booking Helpers ---

// Add a new booking
async function addBooking(data) {
  console.log(data)
  const bookingsRef = collection(db, 'bookings')
  alert('Booking successful!')
  const newDocRef = doc(bookingsRef)
  await setDoc(newDocRef, {
    ...data,
    createdAt: serverTimestamp()
  })
  return newDocRef.id
}

// Cancel a booking
async function cancelBooking(bookingId) {
  const bookingRef = doc(db, 'bookings', bookingId)
  return updateDoc(bookingRef, { status: 'cancelled' })
}

// Get upcoming bookings
async function getUpcomingBookings(userId) {
  const now = new Date().toISOString()
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    where('bookingDate', '>=', now),
    orderBy('bookingDate', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

// Get past bookings
async function getPastBookings(userId) {
  const now = new Date().toISOString()
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    where('bookingDate', '<', now),
    orderBy('bookingDate', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

// Real-time listener for user's bookings (split into upcoming & past)
function listenToUserBookingsSplit(userId, callback) {
  const q = query(collection(db, 'bookings'), where('userId', '==', userId))
  return onSnapshot(q, (snapshot) => {
    const now = new Date().toISOString()
    const upcoming = []
    const past = []

    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() }
      if (data.bookingDate >= now) upcoming.push(data)
      else past.push(data)
    })

    callback({ upcoming, past })
  })
}

// --- Exports ---
export {
  auth,
  db,

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
  addBooking,
  cancelBooking,
  getUpcomingBookings,
  getPastBookings,
  listenToUserBookingsSplit
}
