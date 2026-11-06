import { describe, expect, it } from 'vitest';
import {
  claimPlay,
  takeOverPlay,
  emptyPlayLease,
  ownsPlay,
  PLAY_LEASE_MS,
  releasePlay,
  renewPlay,
} from './playLease';

describe('account-wide gameplay ownership', () => {
  it('explicit takeover rotates the proof immediately and preserves the confirmed save revision', () => {
    const first = {
      ...claimPlay(emptyPlayLease(), 'desktop', null, 100, 'old-proof')!,
      revision: 7,
    };
    const next = takeOverPlay(first, 'phone', 101, 'phone-proof');
    expect(next).toMatchObject({
      holder: 'phone',
      token: 'phone-proof',
      revision: 7,
      generation: 2,
    });
    expect(ownsPlay(next, 'old-proof', 102)).toBe(false);
    expect(renewPlay(next, 'old-proof', 102)).toBeNull();
    expect(releasePlay(next, 'old-proof')).toEqual(next);
    expect(claimPlay(next, 'desktop', 'old-proof', 102, 'retry')).toBeNull();
  });
  it('admits only one device, across any gameplay mode', () => {
    const first = claimPlay(emptyPlayLease(), 'desktop', null, 100, 'secret-a')!;
    expect(claimPlay(first, 'mobile', null, 101, 'secret-b')).toBeNull();
    expect(claimPlay(first, 'desktop', null, 101, 'secret-b')).toBeNull();
    expect(renewPlay(first, 'secret-b', 101)).toBeNull();
    expect(renewPlay(first, 'secret-a', 101)?.expires).toBe(101 + PLAY_LEASE_MS);
  });
  it('fences the previous device after expiry, including late releases and saves', () => {
    const first = claimPlay(emptyPlayLease(), 'desktop', null, 0, 'secret-a')!;
    const second = claimPlay(first, 'mobile', null, PLAY_LEASE_MS, 'secret-b')!;
    expect(second.generation).toBe(2);
    expect(ownsPlay(second, 'secret-a', PLAY_LEASE_MS + 1)).toBe(false);
    expect(renewPlay(second, 'secret-a', PLAY_LEASE_MS + 1)).toBeNull();
    expect(releasePlay(second, 'secret-a')).toEqual(second);
    expect(ownsPlay(second, 'secret-b', PLAY_LEASE_MS + 1)).toBe(true);
  });
  it('releases without resetting the fence or save revision', () => {
    const first = { ...claimPlay(emptyPlayLease(), 'desktop', null, 0, 'a')!, revision: 3 };
    const next = claimPlay(releasePlay(first, 'a'), 'mobile', null, 1, 'b')!;
    expect(next.generation).toBe(2);
    expect(next.revision).toBe(3);
  });
});
