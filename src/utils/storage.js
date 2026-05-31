import { STORAGE_KEY, SESSION_KEY } from './constants';

export const DEFAULT_PASSWORDS = {
  kakak: '369c65b755dcaae4e23c927660782dc27359d2f84d79afa3415d596ed9abb0ea',
  adik: '20fc09e6b5b73dc0386b308be824b2a69c988ce5ce85e81a36f32d58ec70cb2c',
};

export const defaultState = () => ({
  currentHolder: 'kakak',
  deadline: null,
  cycleStartedAt: null,
  totalKas: 0,
  history: [],
  passwords: { ...DEFAULT_PASSWORDS },
  pendingPhoto: null,
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const merged = { ...defaultState(), ...parsed };
    merged.passwords = { ...DEFAULT_PASSWORDS };
    return merged;
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getSession() {
  let userId = localStorage.getItem(SESSION_KEY);
  if (!userId) {
    userId = sessionStorage.getItem(SESSION_KEY);
    if (userId) {
      localStorage.setItem(SESSION_KEY, userId);
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
  return userId;
}

export function setSession(userId) {
  localStorage.setItem(SESSION_KEY, userId);
  sessionStorage.removeItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
