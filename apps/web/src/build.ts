// Which build is running: the version (apps/web/package.json), the commit it was built from, and when. Filled in by Vite at build
// time (see vite.config.ts); tests and anything run outside Vite get a plain "dev" build.

declare const __SR_BUILD__:
  { version: string; commit: string; dirty: boolean; date: string } | undefined;

const raw =
  typeof __SR_BUILD__ !== 'undefined'
    ? __SR_BUILD__
    : { version: '0.0.0', commit: 'dev', dirty: false, date: '' };

const when = raw.date ? new Date(raw.date) : null;

export const BUILD = {
  ...raw,
  /** short and readable: "v0.1.0 · 44fc840 · 23 Oct 2026, 14:05" */
  label: [
    `v${raw.version}`,
    `${raw.commit}${raw.dirty ? '+' : ''}`,
    when
      ? when.toLocaleString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  ]
    .filter(Boolean)
    .join(' · '),
};
