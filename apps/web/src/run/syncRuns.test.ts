import { expect, it, vi, beforeEach } from 'vitest';
const state = vi.hoisted(() => ({
  named: false,
  history: [] as { id: string; hero: string; tier: number; ascendancy: string; won: boolean }[],
  report: vi.fn(),
  order: [] as string[],
}));
vi.mock('../pvp/config', () => ({ hasUsername: () => state.named, getName: () => 'Sharkbait' }));
vi.mock('../pvp/boardApi', () => ({
  restoreUsername: () => {
    state.named = true;
    state.order.push('identity');
    return Promise.resolve();
  },
  reportRun: (x: unknown) => {
    state.order.push('report');
    state.report(x);
    return Promise.resolve();
  },
}));
vi.mock('./saves', () => ({ listRuns: () => [] }));
vi.mock('./history', () => ({ runHistory: () => state.history }));
vi.mock('./runCloud', () => ({
  syncLists: () => {
    state.order.push('cloud');
    state.history = [
      {
        id: 'won-golemancer',
        hero: 'engineer',
        ascendancy: 'engineer:golemancer',
        tier: 12,
        won: true,
      },
    ];
    return Promise.resolve(false);
  },
}));
beforeEach(() => {
  state.named = false;
  state.history = [];
  state.order = [];
  state.report.mockClear();
});
it('waits for restored identity and cloud victory history before repairing the board', async () => {
  const { syncSavedRuns } = await import('./syncRuns');
  await syncSavedRuns();
  expect(state.order).toEqual(['identity', 'cloud', 'report']);
  expect(state.report).toHaveBeenCalledWith(
    expect.objectContaining({ seed: 'won-golemancer', completed: true, tier: 12, stage: 3 }),
  );
});
