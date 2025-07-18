import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB-nFFhuleGVDylUC-gbPSLo7gmtlgHHlw",
  authDomain: "ai-toastmaster.firebaseapp.com",
  projectId: "ai-toastmaster",
  storageBucket: "ai-toastmaster.appspot.com",
  messagingSenderId: "801234969260",
  appId: "1:801234969260:web:cf0422333d55838f9cf509",
  measurementId: "G-1GEZQY6716"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app; 