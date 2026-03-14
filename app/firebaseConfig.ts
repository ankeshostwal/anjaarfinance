import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyD8Buv_Gzm97Q9E9gpl7kZmOaG_hGHFCQI",
  authDomain:        "anjaarfinance-865f7.firebaseapp.com",
  projectId:         "anjaarfinance-865f7",
  storageBucket:     "anjaarfinance-865f7.firebasestorage.app",
  messagingSenderId: "798309386568",
  appId:             "1:798309386568:web:ed5decf4b7b4cf2c25cb7d",
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
