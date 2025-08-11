import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyB-nFFhuleGVDylUC-gbPSLo7gmtlgHHlw",
  authDomain: "ai-toastmaster.firebaseapp.com",
  projectId: "ai-toastmaster",
  storageBucket: "ai-toastmaster.appspot.com",
  messagingSenderId: "801234969260",
  appId: "1:801234969260:web:cf0422333d55838f9cf509",
  measurementId: "G-1GEZQY6716",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize App Check (helps avoid CORS-like 403s when enforcement is on)
// Disabled for development to avoid 403 errors
// TODO: Configure proper App Check for production
/*
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "unused"
      ),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    // no-op if called multiple times due to fast refresh
  }
}
*/

export default app;
