// Monroe Corporation Firebase connection
// Replace every placeholder below with the same Firebase project used by Emerald Games.
// Firebase web config values are public identifiers, but your Firestore security rules still matter.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

const hasPlaceholders = Object.values(firebaseConfig).some((value) => String(value).includes("PASTE_"));

if (hasPlaceholders) {
  console.warn("Monroe Corporation Firebase config still contains placeholders. Update js/firebase.js before using admin verification.");
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const firebaseConfigReady = !hasPlaceholders;
