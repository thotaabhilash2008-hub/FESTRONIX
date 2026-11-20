import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
};

const STAGING_PROJECT_ID = 'festronix-migration-stg26';
const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];
const hasCompleteConfig = requiredConfig.every(Boolean);

if (hasCompleteConfig && firebaseConfig.projectId !== STAGING_PROJECT_ID) {
  throw new Error('This Firebase client is pinned to the migration staging project.');
}

export const isFirebaseConfigured = hasCompleteConfig && firebaseConfig.projectId === STAGING_PROJECT_ID;

if (import.meta.env.PROD && !isFirebaseConfigured) {
  throw new Error('Production builds require the verified FESTRONIX Firebase project configuration.');
}

function getConfiguredApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;

  const existingApps = getApps();
  const existingDefaultApp = existingApps.find(app => app.name === '[DEFAULT]');
  if (existingDefaultApp) {
    if (existingDefaultApp.options.projectId !== firebaseConfig.projectId) {
      throw new Error('The initialized Firebase app does not match VITE_FIREBASE_PROJECT_ID.');
    }
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

/** Firebase is the only supported application backend. */
export const firebaseApp: FirebaseApp | null = getConfiguredApp();
export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
