export const STORAGE_KEY = 'roomCleaningApp';
export const SESSION_KEY = 'roomCleaningSession';

export const CYCLE_DAYS = 20;
export const ADIK_CYCLE_DAYS = 10;
export const FINE_PER_DAY = 5000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const CLEANING_TASKS = [
  'Mengepel lantai',
  'Menyapu lantai',
  'Menurunkan pakaian',
  'Merapikan kasur',
];

export function getCycleDaysForUser(userId) {
  return userId === 'adik' ? ADIK_CYCLE_DAYS : CYCLE_DAYS;
}

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
