import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function run() {
  const docRef = doc(db, "settings", "siteContent");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log("THEME_COLOR:", docSnap.data().primaryColor);
    console.log("SECONDARY_COLOR:", docSnap.data().secondaryColor);
    console.log("FULL_DATA:", JSON.stringify(docSnap.data()));
  } else {
    console.log("No such document!");
  }
  process.exit(0);
}

run().catch(console.error);
