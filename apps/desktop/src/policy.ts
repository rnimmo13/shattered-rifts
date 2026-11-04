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
