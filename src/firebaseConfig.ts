import { Platform } from "react-native";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQnEb_mma4k88qrVzmPiDLGsqv6qWsVsU",
  authDomain: "kushalopariarts-e5d7f.firebaseapp.com",
  projectId: "kushalopariarts-e5d7f",
  storageBucket: "kushalopariarts-e5d7f.firebasestorage.app",
  // Project number from appId (1:58981129406:web:...)
  messagingSenderId: "58981129406",
  appId: "1:58981129406:web:3dd8ac4b3e62ceb77fd2ef",
  // Google Analytics / Firebase Analytics measurement ID
  measurementId: "G-EL25Y1792B",
};

const app: FirebaseApp = getApps().length
  ? getApps()[0]!
  : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

let analyticsInit: Promise<import("firebase/analytics").Analytics | null> | null =
  null;

/** Initialize Analytics on web only (not needed on native Expo Go). */
export function initAnalytics() {
  if (Platform.OS !== "web") return Promise.resolve(null);
  if (!analyticsInit) {
    analyticsInit = (async () => {
      try {
        const { getAnalytics, isSupported } = await import("firebase/analytics");
        if (!(await isSupported())) return null;
        return getAnalytics(app);
      } catch (err) {
        console.warn("Analytics init failed:", err);
        return null;
      }
    })();
  }
  return analyticsInit;
}

/** Log a screen/page view for the current route. */
export async function logPageView(pagePath: string, pageTitle?: string) {
  if (Platform.OS !== "web") return;
  try {
    const analytics = await initAnalytics();
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, "page_view", {
      page_path: pagePath,
      page_title: pageTitle ?? pagePath,
      page_location:
        typeof window !== "undefined" ? window.location.href : undefined,
    });
  } catch (err) {
    console.warn("Analytics page_view failed:", err);
  }
}
