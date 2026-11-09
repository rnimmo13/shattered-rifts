// Shared seeds (DECISIONS #698): every new run has a seed code, shown as K7QM-2XRP, that a friend can type in to play the same maps,
// Wardens and offers. The run itself keeps its own id, so a seed played twice is two runs.

/** letters and digits that cannot be mistaken for each other (no 0/O, 1/I/L) */
const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE = /^[A-HJKMNP-Z2-9]{8}$/;
/** the largest multiple of the alphabet's length a byte reaches: bytes past it are thrown away, so every character is as likely */
const FAIR = 256 - (256 % ABC.length);

/** A fresh seed code: 8 characters. */
export function newSeedCode(): string {
  let code = '';
  while (code.length < 8)
    for (const b of crypto.getRandomValues(new Uint8Array(16)))
      if (b < FAIR && code.length < 8) code += ABC[b % ABC.length];
  return code;
}

/** A run's own id, for a run started from the given seed code. */
export const newRunId = (code: string): string =>
  `${code}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

/** A seed code as players see it ("K7QM-2XRP"). */
export const showSeed = (code: string): string =>
  CODE.test(code) ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

/** What a player typed or pasted, as a seed code (spaces, dashes, case and a leading "Seed" do not matter), or null when it is not one. */
export function readSeed(text: string): string | null {
  const code = text
    .toUpperCase()
    .replace(/^\s*SEED\b:?/, '')
    .replace(/[\s-]/g, '');
  return CODE.test(code) ? code : null;
}
