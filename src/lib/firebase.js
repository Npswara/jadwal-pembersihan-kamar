import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, memoryLocalCache, enableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export const db = firebaseApp
  ? initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    })
  : null;

let networkReadyPromise = null;

export function resetFirestoreNetwork() {
  networkReadyPromise = null;
}

export function ensureFirestoreReady() {
  if (!db) return Promise.resolve();
  if (!networkReadyPromise) {
    networkReadyPromise = enableNetwork(db).catch(() => {});
  }
  return networkReadyPromise;
}

export function isOfflineFirestoreError(err) {
  const code = err?.code ?? '';
  const msg = err?.message ?? '';
  return (
    code === 'unavailable' ||
    (/failed-precondition/i.test(code) && /offline/i.test(msg)) ||
    /offline/i.test(msg) ||
    /client is offline/i.test(msg)
  );
}

export function isPermissionDeniedError(err) {
  const code = err?.code ?? '';
  const msg = err?.message ?? '';
  return (
    code === 'permission-denied' ||
    /insufficient permissions/i.test(msg) ||
    /Missing or insufficient permissions/i.test(msg)
  );
}

export function formatFirebaseError(err, fallback = 'Gagal menghubungi Firebase.') {
  if (isPermissionDeniedError(err)) {
    return (
      'Akses ditolak. Buka Firebase Console → Firestore Database → Rules, ' +
      'salin isi file firebase/firestore.rules dari proyek ini, lalu Publish.'
    );
  }
  if (isOfflineFirestoreError(err)) {
    return 'Tidak dapat terhubung ke Firestore. Periksa koneksi internet dan pastikan database sudah dibuat.';
  }
  return err?.message ?? fallback;
}
