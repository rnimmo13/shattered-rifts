/** Explicitly shared diagnostics, not automatically uploaded recordings. */
export const SHARED_REPORT_ID = /^[a-f0-9]{32}$/;
export const SHARED_REPORT_MAX_BYTES = 200_000;
export const SHARED_REPORT_DAYS = 90;
export function validPerformanceReport(raw: unknown): raw is string {
  if (
    typeof raw !== 'string' ||
    !raw.startsWith('Shattered Rifts performance report (') ||
    !raw.includes('== Machine ==') ||
    !raw.includes('== Frames ==') ||
    raw.length > SHARED_REPORT_MAX_BYTES
  )
    return false;
  // UTF-8 length without browser/Node globals: this package also runs in the pure engine environment.
  let bytes = 0;
  for (const ch of raw) {
    const point = ch.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    if (bytes > SHARED_REPORT_MAX_BYTES) return false;
  }
  return true;
}
