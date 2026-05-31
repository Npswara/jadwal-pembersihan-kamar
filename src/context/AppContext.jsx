import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loadState,
  saveState,
  getSession,
  setSession,
  clearSession,
} from '../utils/storage';
import { getUser, getSiblingId, USERS } from '../utils/constants';
import {
  getDaysLate,
  getFineAmount,
  getNextCycleDates,
  formatDateShort,
} from '../utils/dateUtils';
import { verifyPassword } from '../utils/auth';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [currentUserId, setCurrentUserId] = useState(getSession);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const login = useCallback(
    async (userId, password) => {
      const storedHash = state.passwords[userId];
      const valid = await verifyPassword(password, storedHash);
      if (!valid) return { ok: false, message: 'Kata sandi tidak sesuai. Silakan coba lagi.' };
      setSession(userId);
      setCurrentUserId(userId);
      return { ok: true };
    },
    [state.passwords]
  );

  const logout = useCallback(() => {
    clearSession();
    setCurrentUserId(null);
  }, []);

  const submitPhotoProof = useCallback(
    (imageData) => {
      if (!currentUserId) return { ok: false, message: 'Sesi tidak aktif.' };
      if (state.currentHolder !== currentUserId) {
        return { ok: false, message: 'Hanya pemegang giliran yang dapat mengirim bukti foto.' };
      }
      if (state.pendingPhoto) {
        return { ok: false, message: 'Masih ada bukti foto yang menunggu konfirmasi.' };
      }

      setState((prev) => ({
        ...prev,
        pendingPhoto: {
          from: currentUserId,
          imageData,
          submittedAt: new Date().toISOString(),
        },
      }));
      return { ok: true, message: 'Bukti foto telah dikirim. Menunggu konfirmasi dari saudara.' };
    },
    [currentUserId, state.currentHolder, state.pendingPhoto]
  );

  const confirmPhoto = useCallback(() => {
    if (!currentUserId || !state.pendingPhoto) {
      return { ok: false, message: 'Tidak ada bukti foto untuk dikonfirmasi.' };
    }

    const { from, submittedAt } = state.pendingPhoto;
    const confirmerId = currentUserId;
    const cleanerId = from;

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
  }, [currentUserId, state.pendingPhoto, state.deadline]);

  const rejectPhoto = useCallback(() => {
    if (!currentUserId || !state.pendingPhoto) {
      return { ok: false, message: 'Tidak ada bukti foto.' };
    }
    if (state.pendingPhoto.from === currentUserId) {
      return { ok: false, message: 'Tidak dapat menolak bukti sendiri.' };
    }

    setState((prev) => ({ ...prev, pendingPhoto: null }));
    return { ok: true, message: 'Bukti foto ditolak. Pemegang giliran diminta mengirim ulang.' };
  }, [currentUserId, state.pendingPhoto]);

  const clearHistory = useCallback(() => {
    if (currentUserId !== 'kakak') {
      return { ok: false, message: 'Hanya Kakak yang dapat menghapus riwayat.' };
    }
    setState((prev) => ({
      ...prev,
      history: [],
      totalKas: 0,
    }));
    return { ok: true, message: 'Riwayat dan dana kas telah direset.' };
  }, [currentUserId]);

  const value = {
    state,
    currentUserId,
    currentUser: currentUserId ? getUser(currentUserId) : null,
    tick,
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
