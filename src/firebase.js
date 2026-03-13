import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC9Mmi2kpizV6_8nlNJxLJKM29mVsuw-PM",
  authDomain: "kentehaul-b1cb5.firebaseapp.com",
  projectId: "kentehaul-b1cb5",
  storageBucket: "kentehaul-b1cb5.firebasestorage.app",
  messagingSenderId: "761348006440",
  appId: "1:761348006440:web:567ab1b48f0f6c5efc8b1d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);

// Configure Persistence (Session Only)
// setPersistence(auth, browserSessionPersistence)
//   .catch((error) => console.error("Auth Persistence Error:", error));