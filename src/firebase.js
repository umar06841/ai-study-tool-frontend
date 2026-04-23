import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmRu_ZATsGo847qrBH9PcNmXUFDXeFFF4",
  authDomain: "learnova-16738.firebaseapp.com",
  projectId: "learnova-16738",
  storageBucket: "learnova-16738.firebasestorage.app",
  messagingSenderId: "18480231520",
  appId: "1:18480231520:web:043972d515a0679ac2bf05",
  measurementId: "G-Z5BB4BBFYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);