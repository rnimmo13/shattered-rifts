// The battlefield: a layered Pixi scene. Presentation only: it knows nothing about game rules.
//
// Layers, back to front:
//   sky · drifting shards · ruins · far fog · arena floor · floor cracks (pulse) · slots ·
//   [units, traps, effects: later phases] · mid fog · rift motes & embers · near fog · vignette
//
// All numbers that control cost (particle cap, fog speed, parallax, pulse, resolution) come from an
// EffectsProfile, so "reduced effects" and prefers-reduced-motion are handled in one place.

import { Application, Container, Sprite, Texture, TilingSprite, UPDATE_PRIORITY } from 'pixi.js';
import gsap from 'gsap';
import { color, hex, stage } from '../../design/tokens';
import type { EffectsProfile } from '../effects';
import { floorTop, rows } from './layout';
import { Fighters } from '../../fight/Fighters';
import { ARENA_LOOK, ArenaProps, loadArena, tiledFloor, type ArenaPack } from './arena';
import { sceneWall, loadVenueArt, type VenueArt, type VenueId } from './venue';
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
  PAD_Y,
  floorTextures,
  fogTexture,
  contactTexture,
  glowTexture,
  ruinsTexture,
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

/** Internal pixels we're willing to shade per frame: a 1080p-ish budget, lower in reduced mode. */
const PIXEL_BUDGET = { full: 2_400_000, reduced: 1_000_000 } as const;

function pickResolution(w: number, h: number, profile: EffectsProfile): number {
  const dpr = window.devicePixelRatio || 1;
  const byBudget = Math.sqrt(PIXEL_BUDGET[profile.mode] / Math.max(1, w * h));
  return Math.max(0.5, Math.min(dpr, profile.maxResolution, byBudget));
}

export type SoundName =
  | 'summon'
  | 'attackWindup'
  | 'attackHit'
  | 'hit'
  | 'death'
  | 'buff'
  | 'select'
  | 'cast'
  | 'trapSet'
  | 'trapCharge'
  | 'trapReveal'
  | 'trapEffect'
  | 'trapSpent';

export interface SceneStats {
  fps: number;
  resolution: number;
}

/** The part of the stage the camera must show (stage px). */
export interface BoardFrame {
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  /** when the screen is taller than the frame needs: hang it from the top of its room instead of centring it */
  hang?: boolean;
}
const DEFAULT_FRAME: BoardFrame = { x0: 0, x1: stage.width, top: 150, bottom: 960 };

export class BattlefieldScene {
  private readonly app: Application;
  private readonly world = new Container();
  private readonly environment = new Container();
  private readonly battlefield: Sprite | null;
  private profile: EffectsProfile;
  private readonly host: HTMLElement;

  private readonly sky!: Sprite;
  private readonly shards!: Sprite;
  private readonly ruins!: Container;
  private readonly fogFar!: TilingSprite;
  private readonly fogMid!: TilingSprite;
  private readonly fogNear!: TilingSprite;
  private readonly riftCrack!: Sprite;
  private readonly riftGlow!: Sprite;
  private readonly motes: Mote[] = [];
  private readonly moteLayer = new Container();
  private readonly glowTex: Texture;
  private vignette!: Sprite;
  private arenaProps: ArenaProps | null = null;
  private atmosphereColor = 0x966eff;
  private particleRise = 1;
  /** where the backdrop's top edge sits (the cave wall starts above the stage) */
  private skyY = 0;

  /** Child layers: the combatants stand in `units`, effects in `fx`. */
  readonly layers = {
    units: new Container(),
    fx: new Container(),
  };

  /** Combat v2: the combatants standing in a line. */
  readonly fighters: Fighters;
  /** Sound hook: every major visual event calls this (wired to audio later). */
  onSound: (name: SoundName) => void = () => undefined;
  /** called after the board is refitted to its host (DOM overlays must be placed again) */
  onFit: () => void = () => undefined;
  private bottomReserve = 0;
  private topReserve = 0;
  /** the part of the stage that must be seen (DECISIONS #443: a phone held upright frames a narrower, taller part) */
  private frame: BoardFrame = DEFAULT_FRAME;
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
  /** Low graphics: the board is drawn until this time (performance.now ms) even with nothing tweening (DECISIONS #570) */
  private awakeUntil = 0;
  private lastDrawn = 0;
  private onPointer = (e: PointerEvent) => {
    // (a hover or an aim changes the rings and the locked target at once: show it on the next frame)
    this.wake(150);
    const r = this.host.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    this.pointer.y = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
  };

  static async create(
    host: HTMLElement,
    profile: EffectsProfile,
    venue: VenueId = 'rift',
  ): Promise<BattlefieldScene> {
    const [art, arena] = await Promise.all([loadVenueArt(venue), loadArena(venue)]);
    const app = new Application();
    await app.init({
      background: hex(color.void),
      resizeTo: host,
      antialias: true,
      autoDensity: true,
      resolution: pickResolution(host.clientWidth, host.clientHeight, profile),
      powerPreference: 'high-performance',
    });
    return new BattlefieldScene(app, host, profile, art, arena, venue);
  }

  private constructor(
    app: Application,
    host: HTMLElement,
    profile: EffectsProfile,
    art: VenueArt | null,
    arena: ArenaPack | null,
    venue: VenueId,
  ) {
    this.app = app;
    this.host = host;
    this.profile = profile;
    host.appendChild(app.canvas);
    app.canvas.style.display = 'block';
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    this.battlefield = arena?.battlefield ? new Sprite(Texture.from(arena.battlefield)) : null;
    if (this.battlefield) app.stage.addChild(this.battlefield);
    app.stage.addChild(this.world);
    this.world.addChild(this.environment);
    this.environment.visible = !this.battlefield;

    // (a texture of this scene's own, never Pixi's shared one: the painted canvases are kept between fights, DECISIONS #572,
    // and a scene that closes destroys its textures, which must not take another scene's with them)
    const tex = (c: HTMLCanvasElement) => Texture.from(c, true);
    this.glowTex = tex(glowTexture(128));

    // --- backdrop ---
    // (the cave swaps the sky for a rock wall, the shards for nothing and the ruins for columns)
    // (a painted arena backdrop replaces all of that, and brings its own scenery)
    const painted = arena?.backdrop ? arena : null;
    const arenaLook = ARENA_LOOK[venue];
    const [red, green, blue] = arenaLook.rift;
    this.atmosphereColor = (red << 16) | (green << 8) | blue;
    // Heat rises, underwater light drifts, dream dust hangs; architecture stays still.
    this.particleRise = /cinder|kron|queen|gorrmaw/.test(venue)
      ? 1.6
      : /thalassar|tide|swamp|stilts/.test(venue)
        ? 0.35
        : /vespera|nyxara|applause|hourglass/.test(venue)
          ? 0.55
          : 1;
    const look = art?.id === 'scene' ? art : null;
    this.sky = new Sprite(
      painted?.backdrop
        ? Texture.from(painted.backdrop)
        : look
          ? tex(sceneWall(look))
          : tex(skyTexture()),
    );
    this.shards = new Sprite(art || painted ? Texture.EMPTY : tex(shardsTexture()));
    if (painted) this.arenaProps = new ArenaProps(painted, arenaLook, this.glowTex, venue);
    this.ruins = this.arenaProps
      ? this.arenaProps.far
      : look
        ? new Container()
        : new Sprite(tex(ruinsTexture()));
    this.sky.x = -PAD_X;
    if (art || painted) this.skyY = -PAD_Y;
    this.sky.y = this.skyY;
    this.shards.x = -PAD_X;
    this.ruins.x = -PAD_X;
    this.ruins.y = RUINS_Y;
    this.environment.addChild(this.sky, this.shards, this.ruins);

    // a wide band of slow fog behind the arena, at the horizon
    this.fogFar = this.makeFog(11, color.violetGlow, 0.34, floorTop - 170, 300);
    this.fogFar.tint = this.atmosphereColor;
    this.fogFar.alpha = /cave|swamp|stilts|tide/.test(venue) ? 0.65 : 0.3;
    this.environment.addChild(this.fogFar);

    // --- arena floor ---
    const ft = floorTextures();
    const floor = new Sprite(tex(ft.floor));
    floor.position.set(ft.originX, ft.originY);
    floor.scale.set(ft.scale);
    if (arena?.floor)
      floor.texture = tex(tiledFloor(arena.floor, ft.floor.width, ft.floor.height, 2, arenaLook));
    else if (look) floor.tint = look.floorTint;
    this.environment.addChild(floor);

    // a pool of violet light along the Rift line
    this.riftGlow = new Sprite(this.glowTex);
    this.riftGlow.anchor.set(0.5);
    this.riftGlow.tint = this.atmosphereColor;
    this.riftGlow.blendMode = 'add';
    this.riftGlow.position.set(stage.width / 2, rows.riftLine);
    this.riftGlow.scale.set((stage.width / 128) * 0.5, 0.9);
    this.riftGlow.alpha = 0.55;
    this.environment.addChild(this.riftGlow);

    this.riftCrack = new Sprite(tex(ft.riftCrack));
    this.riftCrack.position.set(ft.originX, ft.originY);
    this.riftCrack.scale.set(ft.scale);
    this.riftCrack.blendMode = 'add';
    this.riftCrack.tint = this.atmosphereColor;
    this.environment.addChild(this.riftCrack);

    if (this.arenaProps) this.world.addChild(this.arenaProps.ground, this.arenaProps.hang);

    // --- the combatants ---
    this.world.addChild(this.layers.units, this.layers.fx);
    this.fighters = new Fighters({
      container: this.layers.units,
      glowTex: this.glowTex,
      contactTex: tex(contactTexture(128)),
      profile: () => this.profile,
      sound: (n) => this.onSound(n as SoundName),
      wake: (ms) => this.wake(ms),
      // (a rigged hero draws at the board's density: its scale times its resolution, at most 2 device px a CSS px)
      pixelScale: () => this.world.scale.x * Math.min(this.app.renderer.resolution, 2),
    });

    // --- atmosphere over the board ---
    this.fogMid = this.makeFog(23, color.navyLight, 0.36, floorTop + 20, 600);
    this.fogMid.tint = this.atmosphereColor;
    this.fogMid.alpha = /swamp|tide|vespera/.test(venue) ? 0.45 : 0.18;
    if (this.battlefield) this.fogMid.alpha *= 0.25;
    this.world.addChild(this.fogMid);
    this.moteLayer.blendMode = 'add';
    this.world.addChild(this.moteLayer);
    this.fogNear = this.makeFog(37, color.violetDeep, 0.3, 700, 520);
    this.fogNear.tint = this.atmosphereColor;
    this.fogNear.alpha = /swamp|tide|cave/.test(venue) ? 0.4 : 0.12;
    if (this.battlefield) this.fogNear.alpha *= 0.25;
    this.world.addChild(this.fogNear);

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
    // the board draws itself: every frame on High, and on Low only while something is happening (DECISIONS #570)
    // (Pixi added its own draw as `app.render` with `app` as its context, and removes a listener by that same pair)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    app.ticker.remove(app.render, app);
    app.ticker.add(() => this.draw(), undefined, UPDATE_PRIORITY.LOW);
  }

  /** Keep drawing the board for a while (something changed that is not a tween: a hover, a resize). */
  wake(ms: number): void {
    this.awakeUntil = Math.max(this.awakeUntil, performance.now() + ms);
  }

  /**
   * On Low graphics nothing moves at rest, so a frame is drawn only while a tween, a shake or a hit-stop runs (and a moment after,
   * so a tween's last values show), for a moment after a hover, an aim or a change to the fighters, and a few times a second besides.
   * Without a graphics card a drawn frame makes the browser redraw the whole screen, so a still board is what keeps the rest of the
   * page smooth.
   */
  private draw(): void {
    if (this.destroyed) return;
    const now = performance.now();
    if (this.profile.low) {
      // (the top-level tweens and timelines: a timeline counts as running through its gaps and its instant steps)
      const busy =
        this.shakeAmp > 0 ||
        this.hitStopTimer !== null ||
        gsap.globalTimeline.getChildren(false, true, true).some((t) => t.isActive());
      if (busy) this.wake(80);
      else if (now >= this.awakeUntil && now - this.lastDrawn < 250) return;
    }
    this.lastDrawn = now;
    this.app.render();
  }

  private makeFog(
    seed: number,
    tint: string,
    alpha: number,
    y: number,
    height: number,
  ): TilingSprite {
    const tex = Texture.from(fogTexture(seed, 6, true), true);
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

  /** Screen point (client px) -> stage coordinates. */
  clientToStage(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect();
    const k = this.world.scale.x;
    return {
      x: (clientX - rect.left - this.world.position.x) / k,
      y: (clientY - rect.top - this.world.position.y) / k,
    };
  }

  /** Stage coordinates -> screen point (client px). */
  stageToClient(x: number, y: number): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect();
    const k = this.world.scale.x;
    return {
      x: rect.left + this.world.position.x + x * k,
      y: rect.top + this.world.position.y + y * k,
    };
  }

  /** Stage coordinates -> position inside the host element (px), for DOM overlays. */
  stageToHost(x: number, y: number): { x: number; y: number; k: number } {
    const k = this.world.scale.x;
    return { x: this.world.position.x + x * k, y: this.world.position.y + y * k, k };
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
    this.wake(200);
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
    m.s.tint = kind < 0.8 ? this.atmosphereColor : 0xffe4bc;
    const fromRift = kind < 0.74;
    m.x = fromRift ? stage.width / 2 + (r() - 0.5) * 1500 : r() * stage.width;
    m.y = fromRift ? rows.riftLine + (r() - 0.5) * 40 : stage.height * (0.55 + r() * 0.5);
    m.vx = (r() - 0.5) * 12;
    m.vy = -(14 + r() * 34) * this.particleRise;
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

    // The fracture's illumination breathes; the terrain itself never moves.
    const pulse = p.pulse;
    const breathe = (rate: number, phase: number) => 0.5 + 0.5 * Math.sin(t * rate + phase);
    this.riftCrack.alpha = 0.78 + pulse * 0.22 * breathe(1.3, 0);
    this.riftGlow.alpha = 0.42 + pulse * 0.24 * breathe(1.3, 0.3);

    // drifting shards: a slow bob so the sky is never static
    if (p.fogSpeed > 0) {
      this.shards.y = Math.sin(t * 0.22) * 5;
      this.shards.x = -PAD_X + Math.sin(t * 0.13) * 9;
    }

    // (on Low the fighters stand still and the arena's props hang still: only what a card does moves)
    this.fighters.tick(t, p.still || p.low);
    this.arenaProps?.update(t, p.still || p.low);

    // pointer parallax: the far layers shift a little more than the near ones
    if (p.parallax > 0) {
      this.parallax.x += (this.pointer.x - this.parallax.x) * Math.min(1, dt * 2.4);
      this.parallax.y += (this.pointer.y - this.parallax.y) * Math.min(1, dt * 2.4);
      const px = this.parallax.x * p.parallax;
      const py = this.parallax.y * p.parallax;
      this.sky.position.set(-PAD_X - px * 14, this.skyY - py * 6);
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
    this.wake(200);
  }

  getStats(): SceneStats {
    return { ...this.stats, resolution: this.app.renderer.resolution };
  }

  /** Screen px at the bottom that something else (the hand) covers; the board is fitted above it. */
  setBottomReserve(px: number): void {
    this.bottomReserve = Math.max(0, px);
    this.fit();
  }

  /** Screen px at the top that something else (the top bar, on a small screen) covers; the board is fitted below it. */
  setTopReserve(px: number): void {
    this.topReserve = Math.max(0, px);
    this.fit();
  }

  /** Which part of the stage must be seen, and the strips at the top and bottom that other things cover, all at once. */
  setFrame(frame: BoardFrame, reserve: { top: number; bottom: number }): void {
    this.frame = frame;
    this.topReserve = Math.max(0, reserve.top);
    this.bottomReserve = Math.max(0, reserve.bottom);
    this.fit();
  }

  /**
   * Fit the board into the host between the reserved strips. The frame's rows (by default stage y 150..960) are what must
   * stay visible; the sky above can be cropped, and the backdrops extend past the stage so nothing shows bars.
   */
  private fit(): void {
    const w = this.host.clientWidth || this.app.screen.width;
    const h = this.host.clientHeight || this.app.screen.height;
    const { x0, x1, top, bottom } = this.frame;
    const avail = Math.max(100, h - this.bottomReserve - this.topReserve);
    const sx = w / (x1 - x0);
    const sy = avail / (bottom - top);
    const s = Math.min(sx, sy);
    this.world.scale.set(s);
    this.baseX = (w - (x1 - x0) * s) / 2 - x0 * s;
    // (too short for the frame: its bottom sits on the hand and the sky is cropped; too narrow: the frame is centred in its room,
    // or hung from the top of it when the frame asks, leaving the room under it for the controls)
    this.baseY =
      this.topReserve +
      (sy <= sx
        ? avail - bottom * s
        : this.frame.hang
          ? -top * s
          : (avail - (bottom - top) * s) / 2 - top * s);
    this.world.position.set(this.baseX, this.baseY);
    // Scenery covers wide/short displays independently of combat framing. Fighter coordinates,
    // silhouette spacing and hit targets keep their original, undistorted scale.
    const landscapeScale = Math.max(1, (w / s + 80) / FULL_W);
    this.environment.scale.x = landscapeScale;
    this.environment.x = (stage.width / 2) * (1 - landscapeScale);
    if (this.battlefield) {
      // Anchor the painted floor behind the rearmost rank. Cover every viewport edge while
      // preserving the painting's aspect ratio; portraits naturally crop the distant scenery.
      const horizon = Math.max(
        h * 0.2,
        Math.min(h * 0.48, this.baseY + (x1 - x0 < 1000 ? 430 : 540) * s),
      );
      const aspect = this.battlefield.texture.width / this.battlefield.texture.height;
      const height = Math.max(w / aspect, horizon / 0.52, (h - horizon) / 0.48);
      this.battlefield.width = height * aspect;
      this.battlefield.height = height;
      this.battlefield.position.set((w - this.battlefield.width) / 2, horizon - height * 0.52);
    }
    this.vignette.width = w;
    this.vignette.height = h;
    this.onFit();
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
    this.fighters.destroy();
    this.app.destroy({ removeView: true }, { children: true, texture: true });
  }
}
