import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|| "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     || "",
};

// Init Firebase app (singleton safe for SSR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Lazily resolved Analytics instance.
 * - Only runs on client, only when measurementId is present.
 */
let analyticsPromise = null;

if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  analyticsPromise = isSupported()
    .then((ok) => {
      if (ok) {
        const isDev = process.env.NODE_ENV === "development";
        const hasDebugParam = window.location.search.includes("debug=true");
        return initializeAnalytics(app, {
          config: {
            debug_mode: isDev || hasDebugParam, // Enable DebugView programmatically
          },
        });
      }
      return null;
    })
    .catch(() => null);
}

export { app, analyticsPromise };
