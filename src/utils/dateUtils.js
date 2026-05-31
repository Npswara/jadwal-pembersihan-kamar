import { CYCLE_DAYS, FINE_PER_DAY, MS_PER_DAY } from './constants';

export function addDays(date, days) {
  const result = new Date(date);
  result.setTime(result.getTime() + days * MS_PER_DAY);
  return result;
}

export function getFirstOfNextMonth(fromDate = new Date()) {
  const d = new Date(fromDate);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function getNextCycleDates(fromDate = new Date()) {
  const cycleStartedAt = getFirstOfNextMonth(fromDate);
  const deadline = addDays(cycleStartedAt, CYCLE_DAYS);
  return { cycleStartedAt, deadline };
}

export function formatDateId(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isBeforeCycleStart(cycleStartedAt) {
  if (!cycleStartedAt) return false;
  return Date.now() < new Date(cycleStartedAt).getTime();
}

export function getDaysLate(deadline) {
  if (!deadline) return 0;
  const now = Date.now();
  const due = new Date(deadline).getTime();
  if (now <= due) return 0;
  return Math.floor((now - due) / MS_PER_DAY);
}

export function getFineAmount(deadline) {
  return getDaysLate(deadline) * FINE_PER_DAY;
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function splitTimeDiff(diff) {
  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export function getCountdown(deadline, cycleStartedAt) {
  if (!deadline) {
    return { days: 0, hours: 0, minutes: 0, expired: false, noDeadline: true, waiting: false };
  }

  const now = Date.now();
  const start = cycleStartedAt ? new Date(cycleStartedAt).getTime() : null;

  if (start && now < start) {
    const { days, hours, minutes } = splitTimeDiff(start - now);
    return { days, hours, minutes, expired: false, noDeadline: false, waiting: true };
  }

  const diff = new Date(deadline).getTime() - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true, noDeadline: false, waiting: false };
  }

  const { days, hours, minutes } = splitTimeDiff(diff);
  return { days, hours, minutes, expired: false, noDeadline: false, waiting: false };
}

export function getNextDeadline(fromDate = new Date()) {
  return getNextCycleDates(fromDate).deadline;
}
