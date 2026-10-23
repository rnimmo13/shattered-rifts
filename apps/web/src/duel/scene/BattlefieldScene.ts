// The battlefield: a layered Pixi scene. Presentation only: it knows nothing about game rules.
//
// Layers, back to front:
//   sky · drifting shards · ruins · far fog · arena floor · floor cracks (pulse) · slots ·
//   [units, traps, effects: later phases] · mid fog · rift motes & embers · near fog · vignette
//
// All numbers that control cost (particle cap, fog speed, parallax, pulse, resolution) come from an
// EffectsProfile, so "reduced effects" and prefers-reduced-motion are handled in one place.

import { Application, Container, Sprite, Texture, TilingSprite } from 'pixi.js';
import { gsap } from 'gsap';
import { color, ease, hex, stage } from '../../design/tokens';
import type { EffectsProfile } from '../effects';
import { FLOOR_SQUASH, floorTop, rows, slotGeometry, type SlotGeom } from './layout';
import { Monsters, type SoundName } from './Monsters';
import { Traps } from './Traps';
import {
  getBaseSpeed,
  hitStopFor,
  holdSlow,
  releaseSlow,
  resetTimeScale,
  shakeFor,
} from './timescale';
import {
  FULL_W,
  PAD_X,
  floorTextures,
  fogTexture,
  glowTexture,
  ruinsTexture,
  runeRingTexture,
  shardsTexture,
  skyTexture,
  vignetteTexture,
} from './textures';

/** Where the ruins sit: their base meets the arena's far edge. */
const RUINS_Y = floorTop + 12 - 360;

interface Mote {
  s: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  sway: number;
  swayRate: number;
  size: number;
  peak: number;
}

interface SlotView {
  geom: SlotGeom;
  ring: Sprite;
  glow: Sprite;
  phase: number;
  lit: boolean;
  /** ring brightness multiplier (drag dims invalid slots); tweened */
  dim: { k: number };
}

/** Internal pixels we're willing to shade per frame: a 1080p-ish budget, lower in reduced mode. */
const PIXEL_BUDGET = { full: 2_400_000, reduced: 1_000_000 } as const;

function pickResolution(w: number, h: number, profile: EffectsProfile): number {
  const dpr = window.devicePixelRatio || 1;
  const byBudget = Math.sqrt(PIXEL_BUDGET[profile.mode] / Math.max(1, w * h));
  return Math.max(0.5, Math.min(dpr, profile.maxResolution, byBudget));
}

export interface SceneStats {
  fps: number;
  resolution: number;
}

export const slotKey = (g: { side: string; kind: string; index: number }) =>
  `${g.side}-${g.kind}-${g.index}`;

export class BattlefieldScene {
  private readonly app: Application;
  private readonly world = new Container();
  private profile: EffectsProfile;
  private readonly host: HTMLElement;

  private readonly sky!: Sprite;
  private readonly shards!: Sprite;
  private readonly ruins!: Sprite;
  private readonly fogFar!: TilingSprite;
  private readonly fogMid!: TilingSprite;
  private readonly fogNear!: TilingSprite;
  private readonly riftCrack!: Sprite;
  private readonly branchCracks!: Sprite;
  private readonly riftGlow!: Sprite;
  private readonly slotViews: SlotView[] = [];
  private readonly motes: Mote[] = [];
  private readonly moteLayer = new Container();
  private readonly glowTex: Texture;
  private vignette!: Sprite;

  /** Child layers later phases draw into (units, traps, effects). */
  readonly layers = {
    units: new Container(),
    traps: new Container(),
    fx: new Container(),
    dim: new Container(),
    reveal: new Container(),
  };

  /** Monsters standing on the field (Phase 3). */
  readonly monsters: Monsters;
  /** Trap sigils and the reveal sequence (Phase 4). */
  readonly traps: Traps;
  /** Sound hook: every major visual event calls this (wired to audio later). */
  onSound: (name: SoundName) => void = () => undefined;
  private bottomReserve = 0;
  private baseX = 0;
  private baseY = 0;
  private shakeAmp = 0;
  private hitStopTimer: number | null = null;
  private hitStopCooldownUntil = 0;
  private time = 0;
  /** Adaptive quality: if frames run slow the render resolution steps down (never back up, so it can't flicker). */
  private resScale = 1;
  private frameAcc = 0;
  private frameN = 0;
  private warmup = 3;
  private stats: SceneStats = { fps: 0, resolution: 1 };
  private pointer = { x: 0, y: 0 };
  private parallax = { x: 0, y: 0 };
  private destroyed = false;
  private onResize = () => this.applyResolution();
  private onPointer = (e: PointerEvent) => {
    const r = this.host.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    this.pointer.y = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
  };

  static async create(host: HTMLElement, profile: EffectsProfile): Promise<BattlefieldScene> {
    const app = new Application();
    await app.init({
      background: hex(color.void),
      resizeTo: host,
      antialias: true,
      autoDensity: true,
      resolution: pickResolution(host.clientWidth, host.clientHeight, profile),
      powerPreference: 'high-performance',
    });
    return new BattlefieldScene(app, host, profile);
  }

  private constructor(app: Application, host: HTMLElement, profile: EffectsProfile) {
    this.app = app;
    this.host = host;
    this.profile = profile;
    host.appendChild(app.canvas);
    app.canvas.style.display = 'block';
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.stage.addChild(this.world);

    const tex = (c: HTMLCanvasElement) => Texture.from(c);
    this.glowTex = tex(glowTexture(128));

    // --- backdrop ---
    this.sky = new Sprite(tex(skyTexture()));
    this.shards = new Sprite(tex(shardsTexture()));
    this.ruins = new Sprite(tex(ruinsTexture()));
    this.sky.x = -PAD_X;
    this.shards.x = -PAD_X;
    this.ruins.x = -PAD_X;
    this.ruins.y = RUINS_Y;
    this.world.addChild(this.sky, this.shards, this.ruins);

    // a wide band of slow fog behind the arena, at the horizon
    this.fogFar = this.makeFog(11, color.violetGlow, 0.34, floorTop - 170, 300);
    this.world.addChild(this.fogFar);

    // --- arena floor ---
    const ft = floorTextures();
    const floor = new Sprite(tex(ft.floor));
    floor.position.set(ft.originX, ft.originY);
    floor.scale.set(ft.scale);
    this.world.addChild(floor);

    // a pool of violet light along the Rift line
    this.riftGlow = new Sprite(this.glowTex);
    this.riftGlow.anchor.set(0.5);
    this.riftGlow.tint = hex(color.violet);
    this.riftGlow.blendMode = 'add';
    this.riftGlow.position.set(stage.width / 2, rows.riftLine);
    this.riftGlow.scale.set((stage.width / 128) * 0.5, 0.9);
    this.riftGlow.alpha = 0.55;
    this.world.addChild(this.riftGlow);

    this.branchCracks = new Sprite(tex(ft.branchCracks));
    this.branchCracks.position.set(ft.originX, ft.originY);
    this.branchCracks.scale.set(ft.scale);
    this.branchCracks.blendMode = 'add';
    this.riftCrack = new Sprite(tex(ft.riftCrack));
    this.riftCrack.position.set(ft.originX, ft.originY);
    this.riftCrack.scale.set(ft.scale);
    this.riftCrack.blendMode = 'add';
    this.world.addChild(this.branchCracks, this.riftCrack);

    // --- slots ---
    this.buildSlots();

    // --- later phases draw here ---
    this.world.addChild(this.layers.traps, this.layers.units, this.layers.fx);
    // a huge black sheet that dims the whole board (and beyond the stage) during a trap reveal
    const dim = new Sprite(Texture.WHITE);
    dim.tint = 0x000000;
    dim.alpha = 0;
    dim.position.set(-3000, -3000);
    dim.width = 8000;
    dim.height = 8000;
    this.layers.dim.addChild(dim);
    this.traps = new Traps({
      container: this.layers.traps,
      reveal: this.layers.reveal,
      dim,
      fx: this.layers.fx,
      glowTex: this.glowTex,
      profile: () => this.profile,
      sound: (n) => this.onSound(n),
      slot: (key) => this.slotViews.find((v) => slotKey(v.geom) === key)?.geom,
      impact: (n) => this.impact(n),
    });
    this.monsters = new Monsters({
      container: this.layers.units,
      fx: this.layers.fx,
      glowTex: this.glowTex,
      profile: () => this.profile,
      sound: (n) => this.onSound(n),
      slot: (key) => this.slotViews.find((v) => slotKey(v.geom) === key)?.geom,
      impact: (n) => this.impact(n),
    });

    // --- atmosphere over the board ---
    this.fogMid = this.makeFog(23, color.navyLight, 0.36, floorTop + 20, 600);
    this.world.addChild(this.fogMid);
    this.moteLayer.blendMode = 'add';
    this.world.addChild(this.moteLayer);
    this.fogNear = this.makeFog(37, color.violetDeep, 0.3, 700, 520);
    this.world.addChild(this.fogNear);
    // the trap reveal sits above the fog and motes so nothing drifts over the card
    this.world.addChild(this.layers.dim, this.layers.reveal);

    // the vignette lives in SCREEN space so it frames the whole window, not just the 16:9 stage
    this.vignette = new Sprite(tex(vignetteTexture()));
    app.stage.addChild(this.vignette);

    this.setProfile(profile);
    this.fit();
    window.addEventListener('resize', this.onResize);
    // resizeTo applies on the next frame: refit once the new size is really in effect
    app.renderer.on('resize', () => this.fit());
    host.addEventListener('pointermove', this.onPointer);
    app.ticker.add((t) => this.tick(t.deltaMS / 1000));
  }

  private makeFog(
    seed: number,
    tint: string,
    alpha: number,
    y: number,
    height: number,
  ): TilingSprite {
    const tex = Texture.from(fogTexture(seed, 6, true));
    tex.source.style.addressMode = 'repeat';
    const f = new TilingSprite({ texture: tex, width: FULL_W, height });
    f.x = -PAD_X;
    f.y = y;
    f.tint = hex(tint);
    f.alpha = alpha;
    // one tile spans the band's height, so the baked top/bottom fade shows once; x repeats and drifts
    f.tileScale.set(1.6, height / 512);
    return f;
  }

  private buildSlots(): void {
    const ringTex = {
      unit: Texture.from(runeRingTexture(256, 'unit')),
      trap: Texture.from(runeRingTexture(256, 'trap')),
    };
    const slots = new Container();
    for (const geom of slotGeometry()) {
      const w = geom.width * 1.18;
      // a dark inlaid plate gives the slot depth: it reads as carved into the stone
      const plate = new Sprite(this.glowTex);
      plate.anchor.set(0.5);
      plate.tint = hex(color.void);
      plate.alpha = 0.62;
      plate.scale.set((w * 1.05) / 128, ((w * 1.05) / 128) * FLOOR_SQUASH);
      plate.position.set(geom.x, geom.y);
      const ring = new Sprite(ringTex[geom.kind]);
      ring.anchor.set(0.5);
      ring.tint = hex(geom.kind === 'trap' ? color.violetGlow : color.gold);
      ring.alpha = geom.kind === 'trap' ? 0.8 : 0.9;
      ring.scale.set(w / 256, (w / 256) * FLOOR_SQUASH);
      ring.position.set(geom.x, geom.y);

      // the "you can play here" glow: a soft pool of light that fades in on demand
      const glow = new Sprite(this.glowTex);
      glow.anchor.set(0.5);
      glow.tint = hex(geom.kind === 'trap' ? color.violet : color.cyan);
      glow.blendMode = 'add';
      glow.alpha = 0;
      glow.scale.set((w * 1.7) / 128, ((w * 1.7) / 128) * FLOOR_SQUASH);
      glow.position.set(geom.x, geom.y);

      slots.addChild(plate, glow, ring);
      this.slotViews.push({
        geom,
        ring,
        glow,
        phase: Math.random() * Math.PI * 2,
        lit: false,
        dim: { k: 1 },
      });
    }
    this.world.addChild(slots);
  }

  /** Light up the slots a card could be played into (keys from slotKey()), or none. */
  highlightSlots(keys: ReadonlySet<string> | 'all' | null): void {
    for (const v of this.slotViews) {
      const on = keys === 'all' || (keys !== null && keys.has(slotKey(v.geom)));
      if (on === v.lit) continue;
      v.lit = on;
      gsap.to(v.glow, {
        alpha: on ? 0.85 : 0,
        duration: on ? 0.4 : 0.28,
        ease: on ? ease.out.gsap : ease.inOut.gsap,
        overwrite: true,
      });
    }
  }

  /**
   * While a card is being dragged: valid slots glow, the others sink into shadow. null restores everything.
   * (Phase 2 visual; the legal-target rules live outside the scene.)
   */
  setDragTargets(valid: ReadonlySet<string> | null): void {
    this.highlightSlots(valid);
    for (const v of this.slotViews) {
      const dim = valid !== null && !valid.has(slotKey(v.geom));
      gsap.to(v.dim, { k: dim ? 0.3 : 1, duration: 0.25, ease: ease.out.gsap, overwrite: true });
    }
  }

  /** The slot under a screen point (client px), or null. Slots are hit as a tall ellipse so a standing unit counts. */
  slotAtClient(clientX: number, clientY: number): SlotGeom | null {
    const rect = this.host.getBoundingClientRect();
    const k = this.world.scale.x;
    const sx = (clientX - rect.left - this.world.position.x) / k;
    const sy = (clientY - rect.top - this.world.position.y) / k;
    let best: SlotGeom | null = null;
    let bestD = 1;
    for (const v of this.slotViews) {
      const rx = v.geom.width * 0.62;
      const ry = Math.max(v.geom.width * 0.62 * FLOOR_SQUASH * 1.9, 34);
      const dx = (sx - v.geom.x) / rx;
      const dy = (sy - (v.geom.y - ry * 0.35)) / ry;
      const d = dx * dx + dy * dy;
      if (d <= bestD) {
        bestD = d;
        best = v.geom;
      }
    }
    return best;
  }

  /** Where a slot sits on screen (client px): arrow endpoints, effects anchored in the DOM. */
  slotClientCenter(key: string): { x: number; y: number } | null {
    const v = this.slotViews.find((sv) => slotKey(sv.geom) === key);
    if (!v) return null;
    const rect = this.host.getBoundingClientRect();
    const k = this.world.scale.x;
    return {
      x: rect.left + this.world.position.x + v.geom.x * k,
      y: rect.top + this.world.position.y + v.geom.y * k,
    };
  }

  setProfile(p: EffectsProfile): void {
    this.profile = p;
    // grow or shrink the mote pool to the cap
    while (this.motes.length < p.particles) this.motes.push(this.newMote());
    while (this.motes.length > p.particles) {
      const m = this.motes.pop();
      m?.s.destroy();
    }
    if (p.fogSpeed === 0) {
      /* fog stays where it is */
    }
    if (p.parallax === 0) this.parallax = { x: 0, y: 0 };
    this.applyResolutionIfReady();
    this.moteLayer.visible = p.particles > 0;
  }

  private applyResolutionIfReady(): void {
    // setProfile runs once before the renderer exists in the constructor path; guard it
    if (this.app.renderer) this.applyResolution();
  }

  private newMote(): Mote {
    const s = new Sprite(this.glowTex);
    s.anchor.set(0.5);
    this.moteLayer.addChild(s);
    const m: Mote = {
      s,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
      life: 1,
      sway: 0,
      swayRate: 1,
      size: 1,
      peak: 0.5,
    };
    this.respawn(m, true);
    return m;
  }

  /** Rift motes (cyan/violet) rise from the Rift line; embers (orange) float up from the dark edges. */
  private respawn(m: Mote, scatter: boolean): void {
    const r = Math.random;
    const kind = r();
    const tint = kind < 0.42 ? color.cyanGlow : kind < 0.74 ? color.violetGlow : color.emberGlow;
    m.s.tint = hex(tint);
    const fromRift = kind < 0.74;
    m.x = fromRift ? stage.width / 2 + (r() - 0.5) * 1500 : r() * stage.width;
    m.y = fromRift ? rows.riftLine + (r() - 0.5) * 40 : stage.height * (0.55 + r() * 0.5);
    m.vx = (r() - 0.5) * 12;
    m.vy = -(14 + r() * 34);
    m.age = scatter ? r() * 6 : 0;
    m.life = 5 + r() * 6;
    m.sway = r() * Math.PI * 2;
    m.swayRate = 0.5 + r() * 0.9;
    m.size = 0.08 + r() * 0.16;
    m.peak = 0.5 + r() * 0.5;
    if (scatter) {
      m.y += (r() - 0.5) * 360;
    }
  }

  private tick(dt: number): void {
    if (this.destroyed) return;
    const p = this.profile;
    this.time += dt;
    const t = this.time;

    // screen shake: a damped random offset on the whole board
    if (this.shakeAmp > 0.25) {
      const a = this.shakeAmp;
      this.world.position.set(
        this.baseX + (Math.random() - 0.5) * 2 * a,
        this.baseY + (Math.random() - 0.5) * 1.4 * a,
      );
      this.shakeAmp *= Math.exp(-dt * 9);
    } else if (this.shakeAmp > 0) {
      this.shakeAmp = 0;
      this.world.position.set(this.baseX, this.baseY);
    }

    this.watchFrameRate(dt);

    // fog drift: three depths at three speeds, in opposite directions for depth
    if (p.fogSpeed > 0) {
      const s = p.fogSpeed * dt;
      this.fogFar.tilePosition.x += 6 * s;
      this.fogMid.tilePosition.x -= 11 * s;
      this.fogNear.tilePosition.x += 17 * s;
    }

    // pulsing cracks: the main Rift line breathes slowly, the branches desync from it
    const pulse = p.pulse;
    const breathe = (rate: number, phase: number) => 0.5 + 0.5 * Math.sin(t * rate + phase);
    this.riftCrack.alpha = 0.78 + pulse * 0.22 * breathe(1.3, 0);
    this.branchCracks.alpha = 0.5 + pulse * 0.4 * breathe(0.85, 1.7);
    this.riftGlow.alpha = 0.42 + pulse * 0.24 * breathe(1.3, 0.3);

    // drifting shards: a slow bob so the sky is never static
    if (p.fogSpeed > 0) {
      this.shards.y = Math.sin(t * 0.22) * 5;
      this.shards.x = -PAD_X + Math.sin(t * 0.13) * 9;
    }

    this.monsters.tick(t, p.still);
    this.traps.tick(t, dt, p.still);

    // slot rings shimmer very slightly, each on its own phase
    for (const v of this.slotViews) {
      const base = v.geom.kind === 'trap' ? 0.8 : 0.9;
      v.ring.alpha = (base + pulse * 0.1 * Math.sin(t * 1.1 + v.phase)) * v.dim.k;
      if (v.lit)
        v.glow.scale.y =
          ((v.geom.width * 1.18 * 1.7) / 128) *
          FLOOR_SQUASH *
          (1 + pulse * 0.05 * Math.sin(t * 2.2 + v.phase));
    }

    // pointer parallax: the far layers shift a little more than the near ones
    if (p.parallax > 0) {
      this.parallax.x += (this.pointer.x - this.parallax.x) * Math.min(1, dt * 2.4);
      this.parallax.y += (this.pointer.y - this.parallax.y) * Math.min(1, dt * 2.4);
      const px = this.parallax.x * p.parallax;
      const py = this.parallax.y * p.parallax;
      this.sky.position.set(-PAD_X - px * 14, -py * 6);
      this.ruins.position.set(-PAD_X - px * 30, RUINS_Y - py * 3);
    }

    // rift motes and embers
    for (const m of this.motes) {
      m.age += dt;
      if (m.age >= m.life) this.respawn(m, false);
      m.sway += dt * m.swayRate;
      m.x += (m.vx + Math.sin(m.sway) * 9) * dt;
      m.y += m.vy * dt;
      const k = m.age / m.life;
      // ease in over the first 15%, out over the last 45%
      const a = k < 0.15 ? k / 0.15 : k > 0.55 ? (1 - k) / 0.45 : 1;
      m.s.alpha = a * m.peak;
      m.s.position.set(m.x, m.y);
      m.s.scale.set(m.size * (0.8 + 0.4 * Math.sin(m.sway * 2)));
    }
  }

  private watchFrameRate(dt: number): void {
    this.frameAcc += dt;
    this.frameN++;
    if (this.frameAcc < 1.5) return;
    const avgMs = (this.frameAcc / this.frameN) * 1000;
    this.stats = { fps: this.frameN / this.frameAcc, resolution: this.app.renderer.resolution };
    if (this.warmup > 0) {
      this.warmup--; // shader compilation and texture upload make the first seconds slow
    } else if (avgMs > 24 && this.resScale > 0.5) {
      this.resScale = Math.max(0.5, this.resScale * 0.8);
      this.applyResolution();
    }
    this.frameAcc = 0;
    this.frameN = 0;
  }

  private applyResolution(): void {
    const base = pickResolution(this.host.clientWidth, this.host.clientHeight, this.profile);
    const res = Math.max(0.5, base * this.resScale);
    this.app.renderer.resize(this.host.clientWidth, this.host.clientHeight, res);
    this.fit();
  }

  getStats(): SceneStats {
    return { ...this.stats, resolution: this.app.renderer.resolution };
  }

  /** Screen px at the bottom that something else (the hand) covers; the board is fitted above it. */
  setBottomReserve(px: number): void {
    this.bottomReserve = Math.max(0, px);
    this.fit();
  }

  /**
   * Fit the board into the host above the reserved strip. The playable rows (stage y 150..960) are what must
   * stay visible; the sky above can be cropped, and the backdrops extend past the stage so nothing shows bars.
   */
  private fit(): void {
    const w = this.host.clientWidth || this.app.screen.width;
    const h = this.host.clientHeight || this.app.screen.height;
    const avail = Math.max(100, h - this.bottomReserve);
    const top = 150;
    const bottom = 960;
    const sx = w / stage.width;
    const sy = avail / (bottom - top);
    const s = Math.min(sx, sy);
    this.world.scale.set(s);
    this.baseX = (w - stage.width * s) / 2;
    this.baseY = sy <= sx ? avail - bottom * s : (avail - (bottom - top) * s) / 2 - top * s;
    this.world.position.set(this.baseX, this.baseY);
    this.vignette.width = w;
    this.vignette.height = h;
  }

  /** Shake the whole board by up to `amount` px (damped). Ignored under reduced motion. */
  shake(amount: number): void {
    if (this.profile.still) return;
    this.shakeAmp = Math.min(30, Math.max(this.shakeAmp, amount));
  }

  /** Freeze the world for a few real milliseconds on a heavy blow. */
  hitStop(ms: number): void {
    if (this.profile.still || ms <= 0) return;
    // a stop is a rare accent: after one, nothing may freeze the board again for a while (multi-hit sequences stay fluid)
    const now = performance.now();
    if (now < this.hitStopCooldownUntil || this.hitStopTimer !== null) return;
    const real = ms / getBaseSpeed();
    this.hitStopCooldownUntil = now + real + 600;
    holdSlow('hitstop', 0.04);
    this.hitStopTimer = window.setTimeout(() => {
      this.hitStopTimer = null;
      releaseSlow('hitstop');
    }, real);
  }

  /** A blow landed: shake and (for big ones) freeze, scaled by its size. Reduced effects halve the shake and skip the freeze. */
  impact(amount: number): void {
    if (this.profile.still) return;
    const reduced = this.profile.mode === 'reduced';
    this.shake(shakeFor(amount) * (reduced ? 0.5 : 1));
    if (!reduced) this.hitStop(hitStopFor(amount));
  }

  destroy(): void {
    this.destroyed = true;
    if (this.hitStopTimer !== null) window.clearTimeout(this.hitStopTimer);
    resetTimeScale();
    window.removeEventListener('resize', this.onResize);
    this.host.removeEventListener('pointermove', this.onPointer);
    gsap.killTweensOf(this.slotViews.flatMap((v) => [v.glow, v.dim]));
    this.monsters.destroy();
    this.traps.destroy();
    this.app.destroy({ removeView: true }, { children: true, texture: true });
  }
}
