import { relative, resolve, sep } from 'node:path';

export const GAME_ORIGIN = 'srgame://app';
export const GAME_URL = `${GAME_ORIGIN}/index.html`;
export const LOCAL_GAME_URL = 'srgame://local/index.html';
export const localGame = (raw: string): boolean => {
  try {
    const url = new URL(raw);
    return url.protocol === 'srgame:' && url.host === 'local';
  } catch {
    return false;
  }
};

/** Only the packaged game's files can be served by this protocol. No filesystem URLs. */
export function assetPath(root: string, raw: string): string | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== 'srgame:' ||
      !['app', 'local'].includes(url.host) ||
      url.username ||
      url.password
    )
      return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.includes(':')) return null;
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const fromRoot = relative(resolve(root), file);
    return fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || resolve(root) === file
      ? null
      : file;
  } catch {
    return null;
  }
}

/** Media the protocol serves in byte ranges, so the player can seek, restart and loop it. */
export const MEDIA_TYPES: Record<string, string> = { '.mp3': 'audio/mpeg' };

/**
 * The inclusive byte span a single-range `Range` header asks for in a file of `size` bytes, or
 * null when the header is absent, malformed, multi-range or unsatisfiable.
 */
export function byteRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || size <= 0 || (m[1] === '' && m[2] === '')) return null;
  let start: number;
  let end: number;
  if (m[1] === '') {
    // a suffix: the last N bytes
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(size - 1, Number(m[2]));
  }
  return start <= end && start < size ? { start, end } : null;
}

export function gameNavigation(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === 'srgame:' &&
      ['app', 'local'].includes(url.host) &&
      !url.username &&
      !url.password &&
      ['/', '/index.html'].includes(url.pathname)
    );
  } catch {
    return false;
  }
}

export function externalLink(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export interface WindowState {
  width: number;
  height: number;
  maximized: boolean;
  fullscreen: boolean;
}

export function windowState(raw: unknown): WindowState {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<WindowState>;
  const size = (n: unknown, fallback: number, min: number, max: number): number =>
    typeof n === 'number' && Number.isFinite(n)
      ? Math.max(min, Math.min(max, Math.round(n)))
      : fallback;
  return {
    width: size(value.width, 1440, 960, 7680),
    height: size(value.height, 900, 640, 4320),
    maximized: value.maximized === true,
    fullscreen: value.fullscreen === true,
  };
}
