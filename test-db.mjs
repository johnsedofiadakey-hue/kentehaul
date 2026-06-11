import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9Mmi2kpizV6_8nlNJxLJKM29mVsuw-PM",
  authDomain: "kentehaul-b1cb5.firebaseapp.com",
  projectId: "kentehaul-b1cb5",
  storageBucket: "kentehaul-b1cb5.firebasestorage.app",
  messagingSenderId: "761348006440",
  appId: "1:761348006440:web:567ab1b48f0f6c5efc8b1d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkImages() {
  const q = query(collection(db, "products"), limit(2));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Product ID:", doc.id);
    console.log("Image URL:", data.image);
  });
  process.exit(0);
}

checkImages();
