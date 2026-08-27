import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAnMXu_iJJIM5xoHYl2bMgsQdHx1IWUaJY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bouldering-4d840.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://bouldering-4d840-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bouldering-4d840",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bouldering-4d840.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "457379325638",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:457379325638:web:a06a8c65c132542f4219c7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-50C9N22C1S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);