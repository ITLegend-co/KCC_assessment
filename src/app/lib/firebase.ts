import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCDwSVuq0p20ass46T8bWBPqgFGj8nXS7M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bouldering-2.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://bouldering-2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bouldering-2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bouldering-2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "781699420973",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:781699420973:web:629a6b9df5b7d78e0f39a4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2WC0T0KFYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
