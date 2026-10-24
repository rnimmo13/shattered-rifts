// Where the PvP server is (shatteredrifts.app unless changed), and who this browser is. A player has no account yet: a random id (per tab, so a refresh keeps
// you in your match) and a display name.

/** Where the server is for everyone who has not set another address. */
const PRODUCTION_SERVER = 'shatteredrifts.app';
const SERVER_KEY = 'sr-pvp-server';
const NAME_KEY = 'sr-pvp-name';
const ID_KEY = 'sr-player-id';

/** "host:port", a full ws(s):// or http(s):// address, or nothing, as typed by a player or set at build time. */
function normalise(raw: string): string {
  const v = raw.trim().replace(/\/+$/, '');
  if (!v) return '';
  if (/^wss?:\/\//i.test(v)) return v;
  if (/^https?:\/\//i.test(v)) return v.replace(/^http/i, 'ws');
  // a bare host: local addresses speak plain ws, the rest wss
  return /^(localhost|127\.|192\.168\.|10\.)/.test(v) ? `ws://${v}` : `wss://${v}`;
}

/** The server a browser should connect to (see README of the PvP setup in docs/DECISIONS.md #161). */
export function serverBase(): string {
  try {
    const saved = localStorage.getItem(SERVER_KEY);
    if (saved) return normalise(saved);
  } catch {
    /* storage unavailable */
  }
  const built = import.meta.env.VITE_PVP_SERVER as string | undefined;
  if (built) return normalise(built);
  // `pnpm pvp:dev` runs the server here
  if (import.meta.env.DEV) return 'ws://127.0.0.1:8787';
  // the game's own address: the Cloudflare Worker that serves the game also runs the server (docs/11_PVP.md)
  return normalise(PRODUCTION_SERVER);
}

export function getServerSetting(): string {
  try {
    return localStorage.getItem(SERVER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setServerSetting(v: string): void {
  try {
    if (v.trim()) localStorage.setItem(SERVER_KEY, v.trim());
    else localStorage.removeItem(SERVER_KEY);
  } catch {
    /* not saved */
  }
}

export function getName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setName(v: string): void {
  try {
    localStorage.setItem(NAME_KEY, v);
  } catch {
    /* not saved */
  }
}

/** Random, kept for the life of the tab. */
export function playerId(): string {
  try {
    let id = sessionStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
