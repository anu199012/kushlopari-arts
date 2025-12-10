// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⬇️ Replace this object with your firebaseConfig from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCQnEb_mma4k88qrVzmPiDLGsqv6qWsVsU",
  authDomain: "kushalopariarts-e5d7f.firebaseapp.com",
  projectId: "kushalopariarts-e5d7f",
  storageBucket: "kushalopariarts-e5d7f.firebasestorage.app",
  messagingSenderId: "58981129406",
  appId: "1:58981129406:web:3dd8ac4b3e62ceb77fd2ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
