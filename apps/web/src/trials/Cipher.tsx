// Cipher: a secret of four different runes from six. Each guess comes back marked: a gold pip for a right rune in the right
// place, a hollow pip for a right rune in the wrong place. Eight guesses.

import { useEffect, useRef, useState, useMemo } from 'react';
import { play } from '../audio/sfx';
import {
  CIPHER_GUESSES,
  CIPHER_LENGTH,
  CIPHER_RUNES,
  cipherScore,
  cipherSecret,
} from './logic';
import { RUNES } from './runes';
import type { GameProps } from './TrialHost';

interface Row {
  guess: number[];
  exact: number;
  near: number;
}

export function Cipher({ seed, onEnd }: GameProps) {
  const secret = useMemo(() => cipherSecret(seed), [seed]);
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<number[]>([]);
  const [over, setOver] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const add = (rune: number): void => {
    if (over || draft.includes(rune) || draft.length >= CIPHER_LENGTH) return;
    play('click');
    setDraft([...draft, rune]);
  };
  const submit = (): void => {
    if (over || draft.length !== CIPHER_LENGTH) return;
    const s = cipherScore(secret, draft);
    const next = [...rows, { guess: draft, ...s }];
    setRows(next);
    setDraft([]);
    if (s.exact === CIPHER_LENGTH) {
      setOver(true);
      play('win');
      timer.current = window.setTimeout(() => onEnd(true), 900);
    } else if (next.length >= CIPHER_GUESSES) {
      setOver(true);
      timer.current = window.setTimeout(() => onEnd(false), 1200);
    }
  };

  const pips = (r: Row): React.ReactNode => (
    <span className="cipher__pips" aria-label={`${r.exact} right place, ${r.near} wrong place`}>
      {Array.from({ length: CIPHER_LENGTH }, (_, i) => (
        <i key={i} className={i < r.exact ? 'is-exact' : i < r.exact + r.near ? 'is-near' : ''} />
      ))}
    </span>
  );

  return (
    <div className="tg">
      <div className="tg__status">
        <span>
          Guess {Math.min(rows.length + 1, CIPHER_GUESSES)} of {CIPHER_GUESSES}
        </span>
        <span>Each rune is used once</span>
      </div>
      <ol className="cipher__rows" aria-label="Your guesses">
        {rows.map((r, n) => (
          <li key={n}>
            <span className="cipher__slots">
              {r.guess.map((g, i) => (
                <b key={i} style={{ color: RUNES[g]?.color }} title={RUNES[g]?.name}>
                  {RUNES[g]?.glyph}
                </b>
              ))}
            </span>
            {pips(r)}
          </li>
        ))}
        {over && rows.length >= CIPHER_GUESSES && rows.at(-1)?.exact !== CIPHER_LENGTH && (
          <li className="cipher__reveal">
            <span className="cipher__slots">
              {secret.map((g, i) => (
                <b key={i} style={{ color: RUNES[g]?.color }}>
                  {RUNES[g]?.glyph}
                </b>
              ))}
            </span>
            <span>It was this</span>
          </li>
        )}
      </ol>
      <div className="cipher__draft" aria-label="Your next guess">
        {Array.from({ length: CIPHER_LENGTH }, (_, i) => (
          <button
            key={i}
            type="button"
            className="cipher__slot"
            disabled={draft[i] === undefined || over}
            aria-label={draft[i] === undefined ? 'Empty slot' : `Remove ${RUNES[draft[i]]?.name}`}
            onClick={() => setDraft(draft.filter((_, j) => j !== i))}
            style={{ color: RUNES[draft[i] ?? -1]?.color }}
          >
            {draft[i] === undefined ? '·' : RUNES[draft[i]]?.glyph}
          </button>
        ))}
        <button
          type="button"
          className="btn btn--small"
          disabled={over || draft.length !== CIPHER_LENGTH}
          onClick={submit}
        >
          <span>Try it</span>
        </button>
      </div>
      <div className="cipher__palette" role="group" aria-label="Runes">
        {Array.from({ length: CIPHER_RUNES }, (_, i) => (
          <button
            key={i}
            type="button"
            className="cipher__rune"
            disabled={over || draft.includes(i) || draft.length >= CIPHER_LENGTH}
            aria-label={RUNES[i]?.name}
            style={{ color: RUNES[i]?.color }}
            onClick={() => add(i)}
          >
            {RUNES[i]?.glyph}
          </button>
        ))}
      </div>
    </div>
  );
}
