/**
 * Timezone-aware date helpers.
 *
 * All "date string" values throughout the app use the YYYY-MM-DD format and
 * represent a calendar day in the user's selected timezone (NOT UTC).
 */

/** Detect the browser's IANA timezone, falling back to UTC. */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Return YYYY-MM-DD for the given Date as observed in `tz`. */
export function isoDateInTz(date: Date = new Date(), tz: string = 'UTC'): string {
  // en-CA gives YYYY-MM-DD format directly.
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Today in the given timezone as YYYY-MM-DD. */
export function todayInTz(tz: string = 'UTC'): string {
  return isoDateInTz(new Date(), tz);
}

/** Local "datetime-local" input value (YYYY-MM-DDTHH:MM) in the given timezone. */
export function localDateTimeInputInTz(date: Date = new Date(), tz: string = 'UTC'): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    // en-CA gives "YYYY-MM-DD, HH:MM" but using formatToParts is robust.
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
}

/** Add `days` to a YYYY-MM-DD string and return a new YYYY-MM-DD. Pure calendar math, no TZ shifts. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Day-of-week (0=Sun..6=Sat) for a YYYY-MM-DD string. */
export function dowFromIso(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Parse a YYYY-MM-DD string to a Date at UTC midnight (safe for display formatting). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * A short, curated list of common IANA timezones for the picker.
 * Users can also use `detectBrowserTimezone()` via "Use device timezone".
 */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh — Dhaka (GMT+6)' },
  { value: 'Asia/Kolkata', label: 'India — Kolkata (GMT+5:30)' },
  { value: 'Asia/Karachi', label: 'Pakistan — Karachi (GMT+5)' },
  { value: 'Asia/Shanghai', label: 'China — Shanghai (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Japan — Tokyo (GMT+9)' },
  { value: 'Asia/Seoul', label: 'South Korea — Seoul (GMT+9)' },
  { value: 'Asia/Dubai', label: 'UAE — Dubai (GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Saudi Arabia — Riyadh (GMT+3)' },
  { value: 'Europe/London', label: 'UK — London' },
  { value: 'Europe/Paris', label: 'Europe — Paris/Berlin' },
  { value: 'Europe/Istanbul', label: 'Turkey — Istanbul (GMT+3)' },
  { value: 'America/New_York', label: 'USA — New York (Eastern)' },
  { value: 'America/Chicago', label: 'USA — Chicago (Central)' },
  { value: 'America/Denver', label: 'USA — Denver (Mountain)' },
  { value: 'America/Los_Angeles', label: 'USA — Los Angeles (Pacific)' },
  { value: 'America/Toronto', label: 'Canada — Toronto' },
  { value: 'America/Sao_Paulo', label: 'Brazil — São Paulo' },
  { value: 'Africa/Cairo', label: 'Egypt — Cairo' },
  { value: 'Africa/Lagos', label: 'Nigeria — Lagos' },
  { value: 'Australia/Sydney', label: 'Australia — Sydney' },
  { value: 'Pacific/Auckland', label: 'New Zealand — Auckland' },
];
