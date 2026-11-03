import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFx, playFx } from './fxPlayer';

vi.mock('../duel/scene/timescale', () => ({ getBaseSpeed: () => 2 }));

// The player only needs these DOM operations. Record its animations without a
// browser clock so cleanup, burst limits and the no-motion path stay testable.
class ElementStub {
  className = '';
  style: Record<string, string> = {};
  children: ElementStub[] = [];
  parent: ElementStub | null = null;
  isConnected = true;
  animations: {
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    onfinish: (() => void) | undefined;
  }[] = [];
  get childElementCount() {
    return this.children.length;
  }
  setAttribute() {}
  appendChild(child: ElementStub) {
    child.parent = this;
    this.children.push(child);
  }
  replaceChildren() {
    for (const child of [...this.children]) child.remove();
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
    this.isConnected = false;
  }
  animate(frames: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = { frames, options, onfinish: undefined as (() => void) | undefined };
    this.animations.push(animation);
    return animation;
  }
}

beforeEach(() => {
  vi.stubGlobal('document', {
    body: new ElementStub(),
    createElement: () => new ElementStub(),
  });
  vi.stubGlobal('localStorage', { getItem: () => 'full' });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  clearFx();
  layer().remove();
  vi.unstubAllGlobals();
});

const layer = (): ElementStub => (document.body as unknown as ElementStub).children[0]!;

describe('painted fight effects', () => {
  it('shows all six frames without an empty seventh frame, follows speed and cleans up', () => {
    playFx('hit-slash', { x: 10, y: 20 }, { dur: 600, flip: true, angle: 30 });
    const effect = layer().children[0]!;
    expect(effect.style.transform).toContain('rotate(30deg) scaleX(-1)');
    const frames = effect.children[0]!.animations[0]!;
    expect(frames.options.duration).toBe(300);
    expect(new Set(frames.frames.map((f) => f.transform)).size).toBe(6);
    expect(frames.frames.at(-1)?.transform).toBe(frames.frames.at(-2)?.transform);
    expect(frames.frames.every((f) => f.easing === 'steps(1, end)')).toBe(true);
    effect.animations[0]!.onfinish!();
    expect(layer().childElementCount).toBe(0);
  });

  it('bounds overlapping effects and frees room when an effect ends', () => {
    for (let i = 0; i < 50; i++) playFx('hit-slash', { x: 10, y: 20 });
    expect(layer().childElementCount).toBe(12);
    layer().children[0]!.animations[0]!.onfinish!();
    playFx('hit-heavy', { x: 10, y: 20 });
    expect(layer().childElementCount).toBe(12);
    clearFx();
    expect(layer().childElementCount).toBe(0);
  });

  it.each(['reduced effects', 'reduced motion'])('holds a peak frame for %s', (mode) => {
    if (mode === 'reduced effects') vi.stubGlobal('localStorage', { getItem: () => 'reduced' });
    else vi.stubGlobal('matchMedia', () => ({ matches: true }));
    playFx('hit-slash', { x: 10, y: 20 });
    const effect = layer().children[0]!;
    const strip = effect.children[0]!;
    expect(strip.style.transform).toBe('translateX(-50%)');
    expect(strip.animations).toHaveLength(0);
    effect.animations[0]!.onfinish!();
    expect(layer().childElementCount).toBe(0);
  });
});
