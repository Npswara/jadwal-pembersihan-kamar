export const STORAGE_KEY = 'roomCleaningApp';
export const SESSION_KEY = 'roomCleaningSession';

export const CYCLE_DAYS = 30;
export const FINE_PER_DAY = 5000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const USERS = {
  kakak: {
    id: 'kakak',
    name: 'Kakak',
    siblingId: 'adik',
    roleLabel: 'Kakak',
  },
  adik: {
    id: 'adik',
    name: 'Adik',
    siblingId: 'kakak',
    roleLabel: 'Adik',
  },
};

export function getUser(id) {
  return USERS[id] ?? null;
}

export function getSiblingId(userId) {
  return USERS[userId]?.siblingId ?? null;
}

export function getSiblingName(userId) {
  const siblingId = getSiblingId(userId);
  return siblingId ? USERS[siblingId].name : '';
}
