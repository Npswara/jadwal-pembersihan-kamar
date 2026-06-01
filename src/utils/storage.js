import { SESSION_KEY } from './constants';
import { DEFAULT_PASSWORDS } from './passwords';

export { DEFAULT_PASSWORDS };

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
