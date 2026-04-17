import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Public Firebase configuration (Safe to be in code as it's a client-side SDK)
const firebaseConfig = {
  apiKey: "AIzaSyCQES_DBkdexEZKw81x2EPVYEPhjiHh8Y8",
  authDomain: "catering-dc8da.firebaseapp.com",
  projectId: "catering-dc8da",
  storageBucket: "catering-dc8da.firebasestorage.app",
  messagingSenderId: "1061693442588",
  appId: "1:1061693442588:web:e7fdf2428040e93fc76dd9",
  measurementId: "G-YDJNJVBTTX"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
auth.useDeviceLanguage();
