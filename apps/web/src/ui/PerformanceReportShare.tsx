import { useState } from 'react';
import { ShareLink } from '../pvp/ShareLink';
import { uploadPerformanceReport } from '../app/sharePerformanceReport';
import { copyLink } from '../pvp/matchHistory';

/** Mounted per recording so a new report never reuses an older report's link. */
export function PerformanceReportShare({
  report,
  existingLink,
  onShared,
}: {
  report: string;
  existingLink?: string | undefined;
  onShared: (link: string) => void;
}) {
  const [link, setLink] = useState<string | null>(existingLink ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  return (
    <div className="settings__reportShare">
      <p className="settings__hint">
        Share report saves this recording online and gives you a short link to send through Discord
        or chat. Anyone with the link can read its timings, graphics and browser details. Reports
        are kept for up to 90 days. Nothing uploads until you press Share report.
      </p>
      {!link ? (
        <button
          type="button"
          className="btn btn--small"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError('');
            void uploadPerformanceReport(report)
              .then(async (value) => {
                setLink(value);
                onShared(value);
                setCopied(await copyLink(value));
              })
              .catch((e: unknown) =>
                setError(
                  e instanceof Error ? e.message : 'Could not share this report. Try again.',
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          <span>{busy ? 'Sharing…' : 'Share report'}</span>
        </button>
      ) : (
        <>
          <p role="status">
            {copied
              ? 'Link copied. Paste it into Discord or send it to Robert.'
              : 'Report saved. Copy this link to send it to Robert.'}
          </p>
          <input
            readOnly
            value={link}
            aria-label="Shared performance report link"
            style={{ width: '100%', minWidth: 0 }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <ShareLink link={link} label="Copy report link" />
        </>
      )}
      {error && <p role="alert">{error} Your recording is still available below.</p>}
    </div>
  );
}
