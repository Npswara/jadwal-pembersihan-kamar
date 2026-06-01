import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  db,
  isFirebaseConfigured,
  ensureFirestoreReady,
  resetFirestoreNetwork,
  isOfflineFirestoreError,
} from './firebase';

const MAX_IMAGE_CHARS = 750_000;

function assertFirebase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      'Firebase belum dikonfigurasi. Isi VITE_FIREBASE_* di file .env (lihat .env.example).'
    );
  }
}

async function withFirestoreRetry(operation, retries = 4) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      await ensureFirestoreReady();
      return await operation();
    } catch (err) {
      lastError = err;
      if (!isOfflineFirestoreError(err) || attempt === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      resetFirestoreNetwork();
      await ensureFirestoreReady();
    }
  }
  throw lastError;
}

function compressDataUrl(dataUrl, quality = 0.6, maxDim = 1280) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function prepareImageForFirestore(imageData) {
  let result = imageData;
  if (result.length > MAX_IMAGE_CHARS) {
    result = await compressDataUrl(result, 0.55, 1024);
  }
  if (result.length > MAX_IMAGE_CHARS) {
    result = await compressDataUrl(result, 0.45, 800);
  }
  if (result.length > MAX_IMAGE_CHARS) {
    throw new Error('Foto terlalu besar. Ambil ulang dari jarak lebih jauh.');
  }
  return result;
}

function mapAppState(data) {
  if (!data) {
    return { currentHolder: 'kakak', deadline: null, cycleStartedAt: null, totalKas: 0 };
  }
  return {
    currentHolder: data.currentHolder ?? 'kakak',
    deadline: data.deadline ?? null,
    cycleStartedAt: data.cycleStartedAt ?? null,
    totalKas: Number(data.totalKas) || 0,
  };
}

function mapHistoryDoc(docSnap) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    date: d.date,
    cleanerId: d.cleanerId,
    confirmerId: d.confirmerId,
    onTime: !!d.onTime,
    daysLate: d.daysLate ?? 0,
    fineLocked: Number(d.fineLocked) || 0,
    text: d.text ?? '',
  };
}

function mapPendingPhoto(data) {
  if (!data) return null;
  return {
    id: data.id,
    from: data.from,
    imageData: data.imageData ?? null,
    submittedAt: data.submittedAt,
  };
}

const appStateRef = () => doc(db, 'app', 'state');
const pendingPhotoRef = () => doc(db, 'app', 'pendingPhoto');
const historyColRef = () => collection(db, 'history');

export async function ensureBootstrap() {
  assertFirebase();
  return withFirestoreRetry(async () => {
    const snap = await getDocFromServer(appStateRef());
    if (!snap.exists()) {
      await setDoc(appStateRef(), {
        currentHolder: 'kakak',
        deadline: null,
        cycleStartedAt: null,
        totalKas: 0,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function fetchAppState() {
  assertFirebase();
  await ensureBootstrap();
  return withFirestoreRetry(async () => {
    const snap = await getDocFromServer(appStateRef());
    return mapAppState(snap.data());
  });
}

async function fetchHistoryFromServer() {
  try {
    const q = query(historyColRef(), orderBy('date', 'desc'));
    const snap = await getDocsFromServer(q);
    return snap.docs.map(mapHistoryDoc);
  } catch (err) {
    if (err?.code === 'failed-precondition') {
      const snap = await getDocsFromServer(historyColRef());
      return snap.docs
        .map(mapHistoryDoc)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    throw err;
  }
}

export async function fetchHistory() {
  assertFirebase();
  return withFirestoreRetry(fetchHistoryFromServer);
}

export async function fetchPendingPhoto() {
  assertFirebase();
  return withFirestoreRetry(async () => {
    const snap = await getDocFromServer(pendingPhotoRef());
    if (!snap.exists()) return null;
    return mapPendingPhoto(snap.data());
  });
}

export async function updateAppState(patch) {
  assertFirebase();
  await ensureBootstrap();
  return withFirestoreRetry(() =>
    setDoc(appStateRef(), { ...patch, updatedAt: serverTimestamp() }, { merge: true })
  );
}

export async function insertHistoryEntry(entry) {
  assertFirebase();
  return withFirestoreRetry(() =>
    setDoc(doc(db, 'history', entry.id), { ...entry, createdAt: serverTimestamp() })
  );
}

export async function uploadPendingPhoto(userId, imageData) {
  assertFirebase();
  const imageDataStored = await prepareImageForFirestore(imageData);
  const id = crypto.randomUUID();
  const pending = {
    id,
    from: userId,
    imageData: imageDataStored,
    submittedAt: new Date().toISOString(),
  };

  await setDoc(pendingPhotoRef(), pending);
  return mapPendingPhoto(pending);
}

export async function deletePendingPhoto(pending) {
  assertFirebase();
  if (!pending) return;
  await deleteDoc(pendingPhotoRef());
}

export async function clearAllHistory() {
  assertFirebase();
  return withFirestoreRetry(async () => {
    const snap = await getDocsFromServer(query(historyColRef(), limit(500)));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.set(appStateRef(), { totalKas: 0, updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  });
}

export function subscribeToChanges({ onAppState, onHistory, onPendingPhoto, onError }) {
  assertFirebase();

  ensureFirestoreReady().catch((err) => onError?.(err));

  const unsubApp = onSnapshot(
    appStateRef(),
    (snap) => onAppState(mapAppState(snap.data())),
    (err) => {
      if (isOfflineFirestoreError(err)) ensureFirestoreReady();
      onError?.(err);
    }
  );

  const unsubPending = onSnapshot(
    pendingPhotoRef(),
    (snap) => {
      onPendingPhoto(mapPendingPhoto(snap.exists() ? snap.data() : null));
    },
    (err) => {
      if (isOfflineFirestoreError(err)) ensureFirestoreReady();
      onError?.(err);
    }
  );

  const q = query(historyColRef(), orderBy('date', 'desc'));
  const unsubHistory = onSnapshot(
    q,
    (snap) => onHistory(snap.docs.map(mapHistoryDoc)),
    (err) => {
      if (isOfflineFirestoreError(err)) ensureFirestoreReady();
      onError?.(err);
    }
  );

  return () => {
    unsubApp();
    unsubPending();
    unsubHistory();
  };
}

export async function loadSharedData() {
  await ensureFirestoreReady();
  const [appState, history, pendingPhoto] = await Promise.all([
    fetchAppState(),
    fetchHistory(),
    fetchPendingPhoto(),
  ]);
  return { ...appState, history, pendingPhoto };
}
