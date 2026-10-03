import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// User's Firebase Project Configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAHY7iW4hbJKpe7kDjRsae-bgboORV__EQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dukaanhelper-dc098.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dukaanhelper-dc098",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dukaanhelper-dc098.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "406253011954",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:406253011954:web:cc8b5ffa30d680c9f9a16b"
};

// Check if Firebase configuration is active
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Initialize Firebase App instance
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
