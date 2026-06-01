import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, setSession, clearSession, DEFAULT_PASSWORDS } from '../utils/storage';
import { getUser, getSiblingId, USERS } from '../utils/constants';
import {
  getDaysLate,
  getFineAmount,
  getNextCycleDates,
  formatDateShort,
} from '../utils/dateUtils';
import { verifyPassword } from '../utils/auth';
import { isFirebaseConfigured, isOfflineFirestoreError, formatFirebaseError } from '../lib/firebase';
import {
  loadSharedData,
  subscribeToChanges,
  uploadPendingPhoto,
  deletePendingPhoto,
  updateAppState,
  insertHistoryEntry,
  clearAllHistory,
} from '../lib/firebaseApi';

const AppContext = createContext(null);

const emptyState = () => ({
  currentHolder: 'kakak',
  deadline: null,
  cycleStartedAt: null,
  totalKas: 0,
  history: [],
  pendingPhoto: null,
});

export function AppProvider({ children }) {
  const [state, setState] = useState(emptyState);
  const [currentUserId, setCurrentUserId] = useState(getSession);
  const [tick, setTick] = useState(0);
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSyncError('Firebase belum dikonfigurasi. Buat file .env dari .env.example.');
      setSyncing(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const data = await loadSharedData();
        if (!cancelled) {
          setState(data);
          setSyncError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSyncError(formatFirebaseError(err, 'Gagal memuat data dari Firebase.'));
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    init();

    const unsubscribe = subscribeToChanges({
      onAppState: (appState) => {
        setState((prev) => ({ ...prev, ...appState }));
      },
      onHistory: (history) => {
        setState((prev) => ({ ...prev, history }));
      },
      onPendingPhoto: (pendingPhoto) => {
        setState((prev) => ({ ...prev, pendingPhoto }));
      },
      onError: (err) => {
        if (isOfflineFirestoreError(err)) return;
        setSyncError(formatFirebaseError(err, 'Gagal sinkronisasi realtime Firebase.'));
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const login = useCallback(async (userId, password) => {
    const storedHash = DEFAULT_PASSWORDS[userId];
    const valid = await verifyPassword(password, storedHash);
    if (!valid) return { ok: false, message: 'Kata sandi tidak sesuai. Silakan coba lagi.' };
    setSession(userId);
    setCurrentUserId(userId);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUserId(null);
  }, []);

  const submitPhotoProof = useCallback(
    async (imageData) => {
      if (!isFirebaseConfigured) {
        return { ok: false, message: 'Firebase belum dikonfigurasi.' };
      }
      if (!currentUserId) return { ok: false, message: 'Sesi tidak aktif.' };
      if (state.currentHolder !== currentUserId) {
        return { ok: false, message: 'Hanya pemegang giliran yang dapat mengirim bukti foto.' };
      }
      if (state.pendingPhoto) {
        return { ok: false, message: 'Masih ada bukti foto yang menunggu konfirmasi.' };
      }

      try {
        const pendingPhoto = await uploadPendingPhoto(currentUserId, imageData);
        setState((prev) => ({ ...prev, pendingPhoto }));
        return { ok: true, message: 'Bukti foto telah dikirim. Menunggu konfirmasi dari saudara.' };
      } catch (err) {
        return { ok: false, message: err.message ?? 'Gagal mengunggah foto.' };
      }
    },
    [currentUserId, state.currentHolder, state.pendingPhoto]
  );

  const confirmPhoto = useCallback(async () => {
    if (!isFirebaseConfigured) {
      return { ok: false, message: 'Firebase belum dikonfigurasi.' };
    }
    if (!currentUserId || !state.pendingPhoto) {
      return { ok: false, message: 'Tidak ada bukti foto untuk dikonfirmasi.' };
    }

    const pending = state.pendingPhoto;
    const confirmerId = currentUserId;
    const cleanerId = pending.from;

    if (confirmerId === cleanerId) {
      return { ok: false, message: 'Anda tidak dapat mengonfirmasi bukti foto sendiri.' };
    }

    if (getSiblingId(cleanerId) !== confirmerId) {
      return { ok: false, message: 'Hanya saudara yang berhak mengonfirmasi.' };
    }

    const completedAt = new Date();
    const daysLate = state.deadline ? getDaysLate(state.deadline) : 0;
    const fine = state.deadline ? getFineAmount(state.deadline) : 0;
    const onTime = daysLate === 0;

    const cleaner = getUser(cleanerId);
    const confirmer = getUser(confirmerId);
    const nextCycle = getNextCycleDates(completedAt, confirmerId);
    const { cycleStartedAt, deadline: nextDeadline } = nextCycle;

    let historyText;
    if (onTime) {
      historyText = `${formatDateShort(completedAt)} — ${cleaner.name} telah menyelesaikan pembersihan kamar. Status: Tepat Waktu. Jadwal berikutnya dialihkan ke ${confirmer.name}.`;
    } else {
      historyText = `${formatDateShort(completedAt)} — ${cleaner.name} telah menyelesaikan pembersihan kamar. Status: Terlambat ${daysLate} Hari (Denda Terbuku: ${fine.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}). Jadwal berikutnya dialihkan ke ${confirmer.name}.`;
    }

    const entry = {
      id: crypto.randomUUID(),
      date: completedAt.toISOString(),
      cleanerId,
      confirmerId,
      onTime,
      daysLate,
      fineLocked: fine,
      text: historyText,
    };

    try {
      await deletePendingPhoto(pending);
      await insertHistoryEntry(entry);
      await updateAppState({
        currentHolder: confirmerId,
        deadline: nextDeadline.toISOString(),
        cycleStartedAt: cycleStartedAt.toISOString(),
        totalKas: state.totalKas + fine,
      });

      setState((prev) => ({
        ...prev,
        currentHolder: confirmerId,
        deadline: nextDeadline.toISOString(),
        cycleStartedAt: cycleStartedAt.toISOString(),
        totalKas: prev.totalKas + fine,
        history: [entry, ...prev.history],
        pendingPhoto: null,
      }));

      return {
        ok: true,
        message: `Konfirmasi berhasil. Giliran berikutnya: ${confirmer.name}. Timer dimulai ${formatDateShort(cycleStartedAt)}. Batas waktu: ${formatDateShort(nextDeadline)}.`,
      };
    } catch (err) {
      return { ok: false, message: err.message ?? 'Gagal mengonfirmasi bukti foto.' };
    }
  }, [currentUserId, state.pendingPhoto, state.deadline, state.totalKas]);

  const rejectPhoto = useCallback(async () => {
    if (!isFirebaseConfigured) {
      return { ok: false, message: 'Firebase belum dikonfigurasi.' };
    }
    if (!currentUserId || !state.pendingPhoto) {
      return { ok: false, message: 'Tidak ada bukti foto.' };
    }
    if (state.pendingPhoto.from === currentUserId) {
      return { ok: false, message: 'Tidak dapat menolak bukti sendiri.' };
    }

    try {
      await deletePendingPhoto(state.pendingPhoto);
      setState((prev) => ({ ...prev, pendingPhoto: null }));
      return { ok: true, message: 'Bukti foto ditolak. Pemegang giliran diminta mengirim ulang.' };
    } catch (err) {
      return { ok: false, message: err.message ?? 'Gagal menolak bukti foto.' };
    }
  }, [currentUserId, state.pendingPhoto]);

  const clearHistory = useCallback(async () => {
    if (!isFirebaseConfigured) {
      return { ok: false, message: 'Firebase belum dikonfigurasi.' };
    }
    if (currentUserId !== 'kakak') {
      return { ok: false, message: 'Hanya Kakak yang dapat menghapus riwayat.' };
    }

    try {
      await clearAllHistory();
      setState((prev) => ({ ...prev, history: [], totalKas: 0 }));
      return { ok: true, message: 'Riwayat dan dana kas telah direset.' };
    } catch (err) {
      return { ok: false, message: err.message ?? 'Gagal menghapus riwayat.' };
    }
  }, [currentUserId]);

  const value = {
    state,
    currentUserId,
    currentUser: currentUserId ? getUser(currentUserId) : null,
    tick,
    syncing,
    syncError,
    login,
    logout,
    submitPhotoProof,
    confirmPhoto,
    rejectPhoto,
    clearHistory,
    users: USERS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
