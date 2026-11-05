import { expect, it } from 'vitest';
import { formatRunTime, RunClock } from './runClock';

it('counts idle time in one run, pauses outside it and preserves independent clocks after reload', () => {
  let now = 0;
  const first = new RunClock(5000, () => now);
  const other = new RunClock(12000, () => now);
  first.resume();
  now = 65000;
  expect(first.elapsed()).toBe(70000);
  expect(other.elapsed()).toBe(12000);
  first.pause();
  other.resume();
  now = 125000;
  expect(first.elapsed()).toBe(70000);
  expect(other.elapsed()).toBe(72000);
  const reloaded = new RunClock(first.elapsed(), () => now);
  reloaded.resume();
  now += 1000;
  expect(reloaded.elapsed()).toBe(71000);
  expect(formatRunTime(reloaded.elapsed())).toBe('00:01:11');
  expect(formatRunTime(100 * 3600000 + 62000)).toBe('100:01:02');
  reloaded.restore(90000);
  expect(reloaded.elapsed()).toBe(90000);
  reloaded.restore(2000);
  expect(reloaded.elapsed()).toBe(90000);
});
