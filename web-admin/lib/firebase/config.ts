import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA98oApRkBpFLL4guT9q0UJP4sU5M6LdK8",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "app-polleria-7e98a.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "app-polleria-7e98a",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "app-polleria-7e98a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "151579555777",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:151579555777:web:6457af9b5a139c2d72e140",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-44ZLF9KXKL",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

// Autenticación silenciosa en el cliente para evitar errores de permisos en Firestore
if (typeof window !== "undefined") {
  signInWithEmailAndPassword(auth, "admin@elbrasero.com", "admin123456")
    .then(() => console.log("🔥 Firebase Auth synchronized successfully"))
    .catch((err) => console.error("❌ Firebase Auth synchronization failed:", err));
}

export default app;
