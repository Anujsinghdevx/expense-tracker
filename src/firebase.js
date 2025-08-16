// src/firebase.js
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const clean = v => (typeof v === 'string' ? v.trim() : v);

export const firebaseConfig = {
  apiKey: clean(process.env.REACT_APP_FIREBASE_API_KEY),
  authDomain: clean(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.REACT_APP_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.REACT_APP_FIREBASE_APP_ID),
};

// helpful runtime checks in dev
if (process.env.NODE_ENV !== 'production') {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error('Missing Firebase env vars:', missing);
  }
  const looksLikeKey = /^AIza[0-9A-Za-z_\-]{35}$/.test(firebaseConfig.apiKey || '');
  if (!looksLikeKey) {
    // eslint-disable-next-line no-console
    console.error('apiKey looks malformed (should start with AIza… and be 39 chars total).');
  }
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
