import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQnEb_mma4k88qrVzmPiDLGsqv6qWsVsU",
  authDomain: "kushalopariarts-e5d7f.firebaseapp.com",
  projectId: "kushalopariarts-e5d7f",
  storageBucket: "kushalopariarts-e5d7f.firebasestorage.app",
  messagingSenderId: "G-EL25Y1792B",
  appId: "1:58981129406:web:3dd8ac4b3e62ceb77fd2ef",
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
