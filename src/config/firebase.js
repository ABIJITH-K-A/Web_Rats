import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBf1c5bC31M0m5PVX67QsyeiOIS-0acRkI",
  authDomain: "unofficial-webrats.firebaseapp.com",
  projectId: "unofficial-webrats",
  storageBucket: "unofficial-webrats.firebasestorage.app",
  messagingSenderId: "378552539429",
  appId: "1:378552539429:web:e4cf876e5b65c9fd4ee2cc",
  measurementId: "G-JYSYHTJKD7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Initialize Firestore with persistent local cache (modern replacement for enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalAutoDetectLongPolling: true,
});

export const storage = getStorage(app);

export default app;
