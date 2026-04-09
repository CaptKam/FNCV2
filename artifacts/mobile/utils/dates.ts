/**
 * Shared date utilities using LOCAL timezone (not UTC).
 *
 * The app deals with meal planning in the user's local context —
 * "tonight's dinner" means local tonight, not UTC tonight.
 * Every date string in the app should be produced by these helpers.
 */

/** Returns today's date as YYYY-MM-DD in LOCAL timezone. */
export function todayLocal(): string {
  return dateToLocal(new Date());
}

/** Converts a Date to YYYY-MM-DD in LOCAL timezone. */
export function dateToLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Adds N days to a YYYY-MM-DD string and returns a new YYYY-MM-DD string. */
export function addDays(dateStr: string, n: number): string {
  const d = parseDateLocal(dateStr);
  d.setDate(d.getDate() + n);
  return dateToLocal(d);
}

/** Parses a YYYY-MM-DD string into a Date at local midnight. */
export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Returns the Monday of the week containing the given date. */
export function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Short day label: "Sun", "Mon", "Tue", etc. */
export function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[parseDateLocal(dateStr).getDay()];
}

/** Full day label: "Sunday", "Monday", etc. */
export function getDayLabelFull(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[parseDateLocal(dateStr).getDay()];
}

/** Short date: "Jan 5", "Apr 9", etc. */
export function formatDateShort(dateStr: string): string {
  const d = parseDateLocal(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/** Returns true if dateStr is today in local timezone. */
export function isToday(dateStr: string): boolean {
  return dateStr === todayLocal();
}

/** Returns true if dateStr is in the past (before today). */
export function isPast(dateStr: string): boolean {
  return dateStr < todayLocal();
}
