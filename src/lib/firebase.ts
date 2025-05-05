import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDaNHhAzJEun1rlZQ65HcDbTJzGY89ftpo",
  authDomain: "iepd-project.firebaseapp.com",
  projectId: "iepd-project",
  storageBucket: "iepd-project.appspot.com",
  messagingSenderId: "974231800662",
  appId: "1:974231800662:web:832830c8b228879bee24f7"
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export default app;