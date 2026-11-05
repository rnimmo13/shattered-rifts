import { SHARED_REPORT_ID, validPerformanceReport } from '@sr/pvp';
import { serverBase } from '../pvp/config';

export async function uploadPerformanceReport(text: string): Promise<string> {
  if (!validPerformanceReport(text))
    throw Error('This recording is invalid or too large to share. Start a shorter recording.');
  const base = serverBase().replace(/^ws/i, 'http');
  const res = await fetch(`${base}/pvp/reports`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => {
    throw Error('Could not share the report. Check your connection and try again.');
  });
  if (!res.ok)
    throw Error(
      res.status === 429
        ? 'Too many reports shared today. Try again later.'
        : res.status === 413
          ? 'This recording is too large to share. Start a shorter recording.'
          : 'Could not share the report. Check your connection and try again.',
    );
  const data = (await res.json()) as { ok?: boolean; id?: unknown };
  if (!data.ok || typeof data.id !== 'string' || !SHARED_REPORT_ID.test(data.id))
    throw Error('The server did not confirm a saved report. Try again.');
  // Use the web server, including from srgame:// desktop origins.
  return `${base}/pvp/reports/${data.id}`;
}
