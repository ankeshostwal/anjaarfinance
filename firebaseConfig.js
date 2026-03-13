import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8BVU_Gzm97Q9E9qpl7kZmOaG_hGfFCQI",
  authDomain: "anjaarfinance-865f7.firebaseapp.com",
  projectId: "anjaarfinance-865f7",
  storageBucket: "anjaarfinance-865f7.firebasestorage.app",
  messagingSenderId: "798309386568",
  appId: "1:798309386568:web:ed5decf4b7b4cf2c25cb7d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);