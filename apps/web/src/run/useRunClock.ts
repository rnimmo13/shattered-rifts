import { useEffect, useMemo } from 'react';
import type { RunState } from '@sr/campaign';
import { RunClock, registerRunTimeCheckpoint } from './runClock';

export function useRunClock(
  run: RunState | null,
  persist: (seed: string, ms: number) => void,
): RunClock {
  const seed = run?.seed;
  const elapsed = run?.elapsedMs ?? 0;
  // Checkpoint writes must not replace a running clock. A different seed gets a separate clock.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clock = useMemo(() => new RunClock(elapsed), [seed]);
  const stopped = !run || run.won === true || run.phase === 'collapsed' || run.phase === 'banked';
  useEffect(() => clock.restore(elapsed), [clock, elapsed]);
  useEffect(() => {
    if (!seed) return;
    const checkpoint = () => persist(seed, clock.elapsed());
    const unregister = registerRunTimeCheckpoint(checkpoint);
    const leaving = () => {
      clock.pause();
      checkpoint();
    };
    const returning = () => {
      if (!stopped) clock.resume();
    };
    returning();
    if (stopped) leaving();
    const timer = window.setInterval(checkpoint, 10_000);
    // Hidden tabs still count while on this run; checkpoint before a browser/native handoff.
    document.addEventListener('visibilitychange', checkpoint);
    window.addEventListener('pagehide', leaving);
    window.addEventListener('pageshow', returning);
    window.addEventListener('beforeunload', checkpoint);
    return () => {
      unregister();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', checkpoint);
      window.removeEventListener('pagehide', leaving);
      window.removeEventListener('pageshow', returning);
      window.removeEventListener('beforeunload', checkpoint);
      leaving();
    };
  }, [clock, seed, stopped, persist]);
  return clock;
}
