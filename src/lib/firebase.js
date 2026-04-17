import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_dummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123:web:abc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-123"
};

// Extremely safe initialization
let auth = null;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.useDeviceLanguage();
} catch (e) {
  console.error("Firebase init failed", e);
}

export { auth };
