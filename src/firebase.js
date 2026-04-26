import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDM6E-Ubm88kNPSF9_f2PnT2gjzu2a_SVU",
  authDomain: "learnova2.firebaseapp.com",
  projectId: "learnova2",
  storageBucket: "learnova2.firebasestorage.app",
  messagingSenderId: "809578251971",
  appId: "1:809578251971:web:f9ad1dc36be3640aba8476"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
