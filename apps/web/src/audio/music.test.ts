import { afterEach, beforeEach, expect, it, vi } from 'vitest';

class FakeAudio {
  static made: FakeAudio[] = [];
  src: string;
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 0;
  paused = true;
  ended = false;
  constructor(src: string) {
    this.src = src;
    FakeAudio.made.push(this);
  }
  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  FakeAudio.made = [];
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
  });
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn() });
  vi.stubGlobal('window', {
    setInterval,
    clearInterval,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const setup = async () => {
  const music = await import('./music');
  const battles = await import('../battleActivity');
  music.startMusic();
  const [menu, battle, victory] = FakeAudio.made as [FakeAudio, FakeAudio, FakeAudio];
  return { music, battles, menu, battle, victory };
};
const settle = async () => {
  await Promise.resolve();
  vi.advanceTimersByTime(1000);
};

it('loops Woodland Fantasy outside battle', async () => {
  const { menu, battle } = await setup();
  expect(menu.src).toContain('music/woodland-fantasy.mp3');
  expect(menu.loop).toBe(true);
  expect(battle.src).toContain('music/blackmoor-tides.mp3');
  expect(battle.loop).toBe(false);
  await settle();
  expect(menu.paused).toBe(false);
  expect(menu.volume).toBeCloseTo(0.4);
  expect(battle.paused).toBe(true);
});

it('starts Blackmoor Tides from the beginning in each battle, then resumes the woodland track', async () => {
  const { battles, menu, battle } = await setup();
  await settle();
  menu.currentTime = 42;
  battle.currentTime = 90;
  const leave = battles.enterBattle();
  await settle();
  expect(battle.paused).toBe(false);
  expect(battle.currentTime).toBe(0);
  expect(menu.paused).toBe(true);
  battle.currentTime = 30;
  leave();
  await settle();
  expect(battle.paused).toBe(true);
  expect(menu.paused).toBe(false);
  expect(menu.currentTime).toBe(42);
  battles.enterBattle();
  await settle();
  expect(battle.currentTime).toBe(0);
});

it('does not restart a battle track that already finished', async () => {
  const { music, battles, battle } = await setup();
  battles.enterBattle();
  await settle();
  battle.ended = true;
  battle.paused = true;
  battle.currentTime = 200;
  music.setMusic({ volume: 0.6 });
  await settle();
  expect(battle.paused).toBe(true);
  expect(battle.currentTime).toBe(200);
});

it('plays Beyond the Clouds from the beginning on the victory screen, then resumes the woodland track', async () => {
  const { music, menu, victory } = await setup();
  expect(victory.src).toContain('music/beyond-the-clouds.mp3');
  expect(victory.loop).toBe(true);
  await settle();
  menu.currentTime = 12;
  victory.currentTime = 80;
  const close = music.enterVictory();
  await settle();
  expect(victory.paused).toBe(false);
  expect(victory.currentTime).toBe(0);
  expect(menu.paused).toBe(true);
  close();
  await settle();
  expect(victory.paused).toBe(true);
  expect(menu.paused).toBe(false);
  expect(menu.currentTime).toBe(12);
});

it('Music off silences everything and is remembered', async () => {
  const { music, menu } = await setup();
  await settle();
  music.setMusic({ on: false });
  await settle();
  expect(menu.paused).toBe(true);
  expect(JSON.parse(localStorage.getItem('sr.music')!)).toEqual({ on: false, volume: 0.4 });
});
