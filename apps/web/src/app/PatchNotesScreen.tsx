// #/patch-notes: what changed from patch to patch, for play testers. One patch at a time: a list of versions down the side
// (newest first), and the chosen patch's notes grouped by kind (New, Changed, Balance, Fixed), so the page never becomes one
// long scroll. The notes themselves are in patchNotes.ts.

import { useEffect, useState } from 'react';
import { BUILD } from '../build';
import { KIND_LABEL, PATCH_NOTES, markSeen, type NoteKind } from './patchNotes';
import './patchnotes.css';

const KINDS: NoteKind[] = ['new', 'changed', 'balance', 'fixed'];

const dateLabel = (d: string): string =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function PatchNotesScreen() {
  const [at, setAt] = useState(0);
  const [only, setOnly] = useState<NoteKind | null>(null);
  // (opening the page reads the newest notes: the home page stops saying "new")
  useEffect(() => markSeen(), []);
  const patch = PATCH_NOTES[at] ?? PATCH_NOTES[0];
  if (!patch) return null;
  const count = (k: NoteKind): number => patch.notes.filter((n) => n.kind === k).length;
  const shown = KINDS.filter((k) => count(k) > 0 && (only === null || only === k));
  const choose = (i: number): void => {
    setAt(i);
    setOnly(null);
  };

  return (
    <main className="patch">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <header className="patch__head">
        <h1>Patch notes</h1>
        <p>
          What changed from patch to patch, newest first. You are playing{' '}
          <b>v{BUILD.version === '0.0.0' ? PATCH_NOTES[0]?.version : BUILD.version}</b>.
        </p>
      </header>

      <div className="patch__layout">
        <nav className="patch__rail" aria-label="Versions">
          <ol>
            {PATCH_NOTES.map((p, i) => (
              <li key={p.version}>
                <button
                  type="button"
                  className={`patch__ver${i === at ? ' is-on' : ''}`}
                  aria-current={i === at ? 'true' : undefined}
                  onClick={() => choose(i)}
                >
                  <span className="patch__verTop">
                    <b>v{p.version}</b>
                    {i === 0 && <em>Latest</em>}
                  </span>
                  <span className="patch__verTitle">{p.title}</span>
                  <small>{dateLabel(p.date)}</small>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <article className="patch__card" aria-labelledby="patch-title">
          <header className="patch__cardHead">
            <div>
              <p className="patch__kicker">
                v{patch.version} · {dateLabel(patch.date)}
              </p>
              <h2 id="patch-title">{patch.title}</h2>
              <p className="patch__summary">{patch.summary}</p>
            </div>
            <div className="patch__step">
              <button
                type="button"
                className="btn btn--small btn--ghost"
                disabled={at >= PATCH_NOTES.length - 1}
                onClick={() => choose(at + 1)}
                aria-label="The patch before"
              >
                <span>‹ Older</span>
              </button>
              <button
                type="button"
                className="btn btn--small btn--ghost"
                disabled={at === 0}
                onClick={() => choose(at - 1)}
                aria-label="The patch after"
              >
                <span>Newer ›</span>
              </button>
            </div>
          </header>

          <div className="patch__filters" role="group" aria-label="Show only">
            <button
              type="button"
              className={`patch__filter${only === null ? ' is-on' : ''}`}
              aria-pressed={only === null}
              onClick={() => setOnly(null)}
            >
              All <small>{patch.notes.length}</small>
            </button>
            {KINDS.filter((k) => count(k) > 0).map((k) => (
              <button
                key={k}
                type="button"
                className={`patch__filter patch__filter--${k}${only === k ? ' is-on' : ''}`}
                aria-pressed={only === k}
                onClick={() => setOnly(only === k ? null : k)}
              >
                {KIND_LABEL[k]} <small>{count(k)}</small>
              </button>
            ))}
          </div>

          {patch.heads && (
            <p className="patch__heads" role="note">
              <b>Heads up:</b> {patch.heads}
            </p>
          )}

          {shown.map((k) => (
            <section key={k} className={`patch__group patch__group--${k}`}>
              <h3>
                <span className="patch__dot" aria-hidden />
                {KIND_LABEL[k]}
              </h3>
              <ul>
                {patch.notes
                  .filter((n) => n.kind === k)
                  .map((n, i) => (
                    <li key={i}>{n.text}</li>
                  ))}
              </ul>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
