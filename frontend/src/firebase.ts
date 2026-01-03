// frontend/src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAPeFJu1ttJrTnaHmAM1xdg7938miXUv1c",
  authDomain: "qezzy-kenya.firebaseapp.com",
  projectId: "qezzy-kenya",
  storageBucket: "qezzy-kenya.firebasestorage.app",
  messagingSenderId: "414301878404",
  appId: "1:414301878404:web:04dc85199b7920cfbbaad1"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();