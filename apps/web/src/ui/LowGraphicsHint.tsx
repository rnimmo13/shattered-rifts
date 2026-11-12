// A one-time note in a fight (DECISIONS #573): when the browser draws without the graphics card and Graphics is on High, the
// game stutters (every moving frame makes the browser redraw the whole screen in software), so it suggests Low, or turning
// hardware acceleration on. Once answered, either way, it is never shown again.

import { useState } from 'react';
import { loadGraphicsQuality, saveGraphicsQuality } from '../duel/effects';
import { drawsInSoftware } from '../duel/renderer';
import { settingsChanged } from '../app/settings';

const KEY = 'sr.lowHintSeen';

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    // (no storage: a note that could not be remembered would show in every fight, so it is not shown)
    return true;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* non-fatal */
  }
}

export function LowGraphicsHint() {
  const [show, setShow] = useState(() => !seen() && loadGraphicsQuality() !== 'low' && drawsInSoftware());
  if (!show) return null;
  const close = (): void => {
    markSeen();
    setShow(false);
  };
  return (
    <div className="lowhint" role="dialog" aria-labelledby="lowhint-title">
      <b id="lowhint-title">The game may stutter on this computer</b>
      <p>
        Your browser is drawing without your graphics card. Switch Graphics to Low for a smoother game, or turn on hardware
        acceleration in your browser&apos;s settings. You can change this any time in Settings.
      </p>
      <span className="lowhint__row">
        <button
          type="button"
          className="btn btn--small btn--primary"
          onClick={() => {
            saveGraphicsQuality('low');
            settingsChanged('graphics');
            close();
          }}
        >
          <span>Switch to Low</span>
        </button>
        <button type="button" className="btn btn--small btn--ghost" onClick={close}>
          <span>Keep High</span>
        </button>
      </span>
    </div>
  );
}
