// The Vault code: the key to this player's saved decks on the server. Shown so it can be kept, and typed on another device to bring
// the same decks there.

import { useState } from 'react';
import { normaliseCode, showCode, type VaultDeck } from '@sr/pvp';
import { ensureVaultCode, remoteVault, setVaultCode, syncVault } from './vaultSync';

export type Online = 'checking' | 'saved' | 'partial' | 'offline';

export function VaultCode(props: {
  online: Online;
  /** the decks in this browser, which go up to the code that is loaded */
  local: readonly VaultDeck[];
  onRestore: (decks: VaultDeck[], complete: boolean) => void;
}) {
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** a code that holds no decks, waiting for a second click so a mistyped code can't replace the real one */
  const [empty, setEmpty] = useState<string | null>(null);
  // the code is made on first use and kept in this browser
  const [code, setCode] = useState(ensureVaultCode);

  const copy = (): void => {
    if (!('clipboard' in navigator)) {
      setNote('Could not copy. Select the code and copy it by hand.');
      return;
    }
    void navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setNote('Could not copy. Select the code and copy it by hand.'));
  };

  const restore = async (anyway: boolean): Promise<void> => {
    const c = normaliseCode(typed);
    if (!c) {
      setNote('That is not a Vault code. It has 16 letters and numbers.');
      return;
    }
    setNote('Looking for that Vault…');
    setEmpty(null);
    const r = await remoteVault.list(c);
    if (!r.ok) {
      setNote(
        r.error === 'offline'
          ? 'Could not reach the server. Try again in a moment.'
          : 'That is not a Vault code.',
      );
      return;
    }
    // any 16 letters make a valid, empty Vault, so an empty one is most likely a typo: ask before switching to it
    if (r.decks.length === 0 && !anyway) {
      setEmpty(c);
      setNote('No decks are saved under that code. Check it for typing mistakes.');
      return;
    }
    const before = code;
    // this browser's decks go up to the code too, so nothing here is lost by switching
    const s = await syncVault(c, props.local);
    if (!s.ok) {
      setNote('Could not reach the server. Try again in a moment.');
      return;
    }
    setVaultCode(c);
    setCode(c);
    setTyped('');
    setEmpty(null);
    props.onRestore(s.decks, s.complete);
    setNote(
      `Now using that Vault (${s.decks.length} deck${s.decks.length === 1 ? '' : 's'}). Your previous code was ${showCode(before)} if you want to go back.`,
    );
  };

  return (
    <details className="pvp__server pvp__vault">
      <summary>
        Vault code{' '}
        <small>
          {props.online === 'saved'
            ? '· your decks are saved online'
            : props.online === 'partial'
              ? '· some decks are only in this browser (the online Vault is full)'
              : props.online === 'offline'
                ? '· could not reach the server, decks are kept in this browser'
                : '· checking…'}
        </small>
      </summary>
      <p>
        Your banked decks are saved under this code. Keep it safe: anyone who has it can use and
        change your Vault. Type it on another device to see the same decks there.
      </p>
      <p className="pvp__vaultcode">
        <b>{showCode(code)}</b>
        <button type="button" className="btn btn--small" onClick={copy}>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </p>
      <span className="pvp__join">
        <input
          value={typed}
          placeholder="Use another code"
          maxLength={24}
          onChange={(e) => setTyped(e.target.value)}
          aria-label="Vault code to load"
        />
        <button
          type="button"
          className="btn btn--small"
          disabled={typed.trim().length < 8}
          onClick={() => void restore(false)}
        >
          <span>Load</span>
        </button>
      </span>
      {note && <p aria-live="polite">{note}</p>}
      {empty && (
        <button type="button" className="btn btn--small" onClick={() => void restore(true)}>
          <span>Use it anyway</span>
        </button>
      )}
    </details>
  );
}
