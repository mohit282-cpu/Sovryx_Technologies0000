import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Initialize Firestore with custom database ID if specified in config
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const db: Firestore = getFirestore(app, databaseId);

// Test Firestore Connection defensively without blocking app execution
if (typeof window !== 'undefined') {
  getDocFromServer(doc(db, '_connection_check', 'ping')).catch((error) => {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore offline or unreachable, using local cache / fallbacks.');
    }
  });
}

// Initialize Storage with defensive fallback
let storageInstance: FirebaseStorage | null = null;
try {
  storageInstance = getStorage(app);
} catch (err) {
  console.warn('Firebase Storage not initialized, fallback data URLs will be used:', err);
}
export const storage = storageInstance;

export default app;

