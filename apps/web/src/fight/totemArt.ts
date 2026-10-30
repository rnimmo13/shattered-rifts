// The Shaman's totem pictures (DECISIONS #429): the carved totems and their spirits, cut by tools/pack-totems.ps1 into
// public/art/totems and listed in its index.json. Loaded once; a kind with no picture keeps
// its drawn mark. Presentation only.

import { useEffect, useState } from 'react';

export interface TotemArt {
  /** kind -> the carved totem's picture url */
  totems: Record<string, string>;
  /** kind -> its spirit's picture url (shown when the totem is commanded) */
  spirits: Record<string, string>;
}

const EMPTY: TotemArt = { totems: {}, spirits: {} };
let loaded: TotemArt | null = null;
let loading: Promise<TotemArt> | null = null;

/** Load the list once (safe to call again; never fails: without it the marks stay). */
export function loadTotemArt(): Promise<TotemArt> {
  if (loaded) return Promise.resolve(loaded);
  loading ??= (async () => {
    const base = import.meta.env.BASE_URL;
    try {
      const res = await fetch(`${base}art/totems/index.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const raw = (await res.json()) as Partial<TotemArt>;
      const url = (m: Record<string, string> | undefined): Record<string, string> =>
        Object.fromEntries(Object.entries(m ?? {}).map(([k, p]) => [k, `${base}art/${p}`]));
      loaded = { totems: url(raw.totems), spirits: url(raw.spirits) };
      // (the spirits show only for a moment: fetched now, so the first command does not wait for one)
      for (const src of Object.values(loaded.spirits)) {
        const img = new Image();
        img.src = src;
      }
      return loaded;
    } catch {
      // (a list that did not come lets the next fight try again)
      loading = null;
      return EMPTY;
    }
  })();
  return loading;
}

/** The totem pictures, once they are known (empty until then). */
export function useTotemArt(): TotemArt {
  const [art, setArt] = useState<TotemArt>(() => loaded ?? EMPTY);
  useEffect(() => {
    let live = true;
    if (!loaded) void loadTotemArt().then((a) => live && setArt(a));
    return () => {
      live = false;
    };
  }, []);
  return art;
}
