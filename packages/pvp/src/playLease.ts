/** One account's gameplay lease. Times and random tokens are supplied by the server. */
export const PLAY_LEASE_MS = 45000;
export interface PlayLease {
  token: string;
  holder: string;
  expires: number;
  generation: number;
  revision: number;
}
export const emptyPlayLease = (): PlayLease => ({
  token: '',
  holder: '',
  expires: 0,
  generation: 0,
  revision: 0,
});
export const ownsPlay = (lease: PlayLease, token: unknown, now: number): boolean =>
  typeof token === 'string' && token !== '' && token === lease.token && now < lease.expires;
export function claimPlay(
  lease: PlayLease,
  holder: string,
  proof: unknown,
  now: number,
  freshToken: string,
): PlayLease | null {
  if (lease.expires > now && !ownsPlay(lease, proof, now)) return null;
  if (ownsPlay(lease, proof, now)) return { ...lease, expires: now + PLAY_LEASE_MS };
  return {
    ...lease,
    token: freshToken,
    holder,
    expires: now + PLAY_LEASE_MS,
    generation: lease.generation + 1,
  };
}
export function renewPlay(lease: PlayLease, token: unknown, now: number): PlayLease | null {
  return ownsPlay(lease, token, now) ? { ...lease, expires: now + PLAY_LEASE_MS } : null;
}

/** The account owner explicitly moves play to this device, preserving save revision. */
export function takeOverPlay(
  lease: PlayLease,
  holder: string,
  now: number,
  freshToken: string,
): PlayLease {
  return {
    ...lease,
    holder,
    token: freshToken,
    expires: now + PLAY_LEASE_MS,
    generation: lease.generation + 1,
  };
}
export function releasePlay(lease: PlayLease, token: unknown): PlayLease {
  return typeof token === 'string' && token !== '' && token === lease.token
    ? { ...lease, token: '', holder: '', expires: 0 }
    : lease;
}
