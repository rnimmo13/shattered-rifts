// A hero drawn from video clips instead of a skeletal rig (DECISIONS #715, the "2D animated models" beta setting). The clips are MP4s
// on a flat key colour (green or magenta): each frame is copied to a WebGL2 canvas and the key colour keyed out in a shader, with its
// spill pulled back at the edges. The canvas is a Pixi texture, exactly as a rig's is, so Fighters and HeroModel drive it the same way.
//
// Clips: idle (a loop, required), and strike, hit, aura and death when a video for them exists. A clip with no video is played on the
// idle video by the canvas itself (a lunge, a flinch with a flash, a glow, a fall), so every moment the board waits for still comes.

import { Texture } from 'pixi.js';
import { HERO_VIDEOS } from '../art/heroVideos';

export type VideoClip = 'idle' | 'strike' | 'hit' | 'aura' | 'death';
type Facing = 'right' | 'left';

/** What a loaded video model brings: its clips' sources, the idle video ready to play, and where the body stands in it. */
export interface VideoAssets {
  kind: 'video';
  hero: string;
  idle: HTMLVideoElement;
  /** the other clips' URLs, by clip ("strike") or clip and variant ("strike:shotgun", the weapon a card swings) */
  clips: Partial<Record<string, string>>;
  /** the video's size, and the body measured from its first frame: feet (bottom middle), height and width, in video px */
  size: { w: number; h: number };
  feet: [number, number];
  bodyH: number;
  bodyW: number;
  /** the key colour, 0-1 */
  key: [number, number, number];
}

const loads = new Map<string, Promise<VideoAssets | null>>();

function video(src: string, loop: boolean): HTMLVideoElement {
  const v = document.createElement('video');
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.loop = loop;
  v.preload = 'auto';
  v.crossOrigin = 'anonymous';
  v.src = src;
  return v;
}

const url = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

/** Load a hero's video model once: null when it has none, the video cannot play, or WebGL2 is missing (the picture stays). */
export function loadHeroVideo(hero: string): Promise<VideoAssets | null> {
  let p = loads.get(hero);
  if (!p) {
    p = (async (): Promise<VideoAssets | null> => {
      const files = HERO_VIDEOS[hero];
      if (!files?.['idle'] || typeof document === 'undefined' || !webgl2()) return null;
      const idle = video(url(files['idle']), true);
      let timer = 0;
      const ready = await new Promise<boolean>((resolve) => {
        idle.addEventListener('loadeddata', () => resolve(true), { once: true });
        idle.addEventListener('error', () => resolve(false), { once: true });
        timer = window.setTimeout(() => resolve(false), 15000);
      });
      clearTimeout(timer);
      const measured = ready && idle.videoWidth ? measure(idle) : null;
      // (a load that failed or ran out of time is tried again the next time this hero is shown)
      if (!measured) {
        loads.delete(hero);
        idle.removeAttribute('src');
        idle.load();
        return null;
      }
      const clips: VideoAssets['clips'] = {};
      for (const [c, path] of Object.entries(files)) if (c !== 'idle') clips[c] = url(path);
      return {
        kind: 'video',
        hero,
        idle,
        clips,
        size: { w: idle.videoWidth, h: idle.videoHeight },
        ...measured,
      };
    })();
    loads.set(hero, p);
  }
  return p;
}

/**
 * The key colour (the frame's corners) and the body's box (everything far enough from it), from a small copy of the first frame. The
 * feet are the bottom of the box, in its middle; the height is the box's.
 */
function measure(
  v: HTMLVideoElement,
): Pick<VideoAssets, 'feet' | 'bodyH' | 'bodyW' | 'key'> | null {
  const scale = Math.min(1, 320 / v.videoWidth);
  const w = Math.max(8, Math.round(v.videoWidth * scale));
  const h = Math.max(8, Math.round(v.videoHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(v, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const at = (x: number, y: number): [number, number, number] => {
    const i = (y * w + x) * 4;
    return [d[i]!, d[i + 1]!, d[i + 2]!];
  };
  // (a few pixels in from the frame's edge, where an encoder may leave a dark line)
  const corners = [at(4, 4), at(w - 5, 4), at(4, h - 5), at(w - 5, h - 5)];
  // (the corner most like the others: a weapon or cape reaching one corner does not move the key)
  const near = (p: number[], q: number[]): number =>
    Math.abs(p[0]! - q[0]!) + Math.abs(p[1]! - q[1]!) + Math.abs(p[2]! - q[2]!);
  const key = [...corners].sort(
    (p, q) =>
      corners.reduce((n, o) => n + near(p, o), 0) - corners.reduce((n, o) => n + near(q, o), 0),
  )[0]!;
  let x0 = w;
  let x1 = -1;
  let y0 = h;
  let y1 = -1;
  for (let y = 3; y < h - 3; y++)
    for (let x = 3; x < w - 3; x++) {
      const [r, gr, b] = at(x, y);
      const far = Math.abs(r - key[0]) + Math.abs(gr - key[1]) + Math.abs(b - key[2]);
      if (far < 150) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  if (x1 < 0) return null;
  return {
    key: [key[0] / 255, key[1] / 255, key[2] / 255],
    feet: [(x0 + x1) / 2 / scale, (y1 + 1) / scale],
    bodyH: Math.max(1, (y1 - y0 + 1) / scale),
    bodyW: Math.max(1, (x1 - x0 + 1) / scale),
  };
}

let gl2: boolean | null = null;
function webgl2(): boolean {
  if (gl2 === null) {
    try {
      const c = document.createElement('canvas');
      const g = c.getContext('webgl2');
      gl2 = !!g;
      g?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      gl2 = false;
    }
  }
  return gl2;
}

const VERT = `#version 300 es
in vec2 a_pos;
uniform mat3 u_m;
out vec2 v_uv;
void main() {
  v_uv = a_pos;
  vec3 p = u_m * vec3(a_pos, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}`;

// (keyed in the YCbCr chroma plane, so a shadow of the key colour keys out as well as its bright face; the spill is the share of a
// pixel's chroma that points the key's way, taken back near the edge)
const FRAG = `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec3 u_key;
uniform vec4 u_tint;
uniform float u_alpha;
out vec4 o;
vec2 chroma(vec3 c) {
  return vec2(-0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b, 0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b);
}
void main() {
  vec4 c = texture(u_tex, v_uv);
  vec2 kc = chroma(u_key);
  vec2 pc = chroma(c.rgb);
  float d = distance(pc, kc);
  float a = smoothstep(0.10, 0.20, d);
  // (a grey key has no chroma direction: no spill to take back, and no division by zero)
  float kl = length(kc);
  vec2 dir = kl > 0.001 ? kc / kl : vec2(0.0);
  float spill = max(0.0, dot(pc, dir)) * (1.0 - smoothstep(0.20, 0.45, d));
  float y = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  vec2 fixedc = pc - dir * spill;
  vec3 rgb = vec3(y + 1.402 * fixedc.y, y - 0.344136 * fixedc.x - 0.714136 * fixedc.y, y + 1.772 * fixedc.x);
  rgb = mix(clamp(rgb, 0.0, 1.0), u_tint.rgb, u_tint.a);
  float alpha = a * u_alpha;
  o = vec4(rgb * alpha, alpha);
}`;

/** how long each clip runs when it has no video of its own (seconds), and when its moment comes, as a share of it */
const MADE: Record<Exclude<VideoClip, 'idle'>, { dur: number; event: string; at: number }> = {
  strike: { dur: 0.55, event: 'hit', at: 0.45 },
  aura: { dur: 0.5, event: 'aura', at: 0.4 },
  hit: { dur: 0.3, event: 'hit', at: 0 },
  death: { dur: 1.2, event: 'land', at: 0.75 },
};
/** the largest side of the canvas, in pixels */
const MAX_SIDE = 2048;
/** the widest a model may stand, as a share of the height it is given: a wide stance is drawn smaller to fit, as a painting would be */
const MAX_WIDTH = 0.85;

export class VideoHeroSprite {
  readonly canvas: HTMLCanvasElement;
  readonly texture: Texture;
  private readonly gl: WebGL2RenderingContext;
  private readonly prog: WebGLProgram;
  private readonly tex: WebGLTexture;
  private readonly loc: {
    m: WebGLUniformLocation | null;
    key: WebGLUniformLocation | null;
    tint: WebGLUniformLocation | null;
    alpha: WebGLUniformLocation | null;
  };
  private disposed = false;
  private k = 1;
  private px = 1;
  /** the canvas's frame in video px: the video, with room around it for a lunge and a fall */
  private readonly frame: { x0: number; y0: number; w: number; h: number };
  private clipName: VideoClip = 'idle';
  /** the clip under way has no video of its own: the idle video plays it, with the canvas's own motion */
  private madeUp = false;
  /** this sprite's own idle loop (the loaded one is only the shared stand-in until it can play) */
  private readonly idle: HTMLVideoElement;
  private t = 0;
  private dur = 0;
  private fired = false;
  private ended = false;
  private onEvent: ((e: { name: string }) => void) | undefined;
  private onEnd: (() => void) | undefined;
  /** the video drawn now: the idle loop, or a clip's own */
  private current: HTMLVideoElement;
  /** its clips' own videos, by URL, loaded as it is made so the first blow plays its own clip */
  private readonly own = new Map<string, HTMLVideoElement>();
  /** when the moment of the clip under way comes, as a share of it */
  private at = 0;

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    private readonly a: VideoAssets,
    readonly facing: Facing,
  ) {
    this.canvas = canvas;
    this.gl = gl;
    const { w, h } = a.size;
    const room = a.bodyH * 0.35;
    this.frame = { x0: -room, y0: -h * 0.05, w: w + 2 * room, h: h * 1.1 };
    this.prog = program(gl);
    this.loc = {
      m: gl.getUniformLocation(this.prog, 'u_m'),
      key: gl.getUniformLocation(this.prog, 'u_key'),
      tint: gl.getUniformLocation(this.prog, 'u_tint'),
      alpha: gl.getUniformLocation(this.prog, 'u_alpha'),
    };
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(this.prog, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.idle = video(a.idle.currentSrc || a.idle.src, true);
    this.current = this.idle;
    void this.idle.play().catch(() => undefined);
    for (const src of new Set(Object.values(a.clips))) {
      if (!src) continue;
      const v = video(src, false);
      this.own.set(src, v);
      // (where a strike lands in its own clip: measured once from its frames, while the idle plays)
      if (/strike/.test(src)) void impactOf(src, a.key);
    }
    this.texture = Texture.from(canvas);
    this.texture.dynamic = true;
  }

  static create(assets: VideoAssets, facing: Facing): VideoHeroSprite | null {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return null;
    try {
      return new VideoHeroSprite(canvas, gl, assets, facing);
    } catch {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return null;
    }
  }

  get anchor(): { x: number; y: number } {
    const f = this.frame;
    const u = (this.a.feet[0] - f.x0) / f.w;
    return { x: this.facing === 'right' ? u : 1 - u, y: (this.a.feet[1] - f.y0) / f.h };
  }

  get stageScale(): number {
    return 1 / this.px;
  }

  /** the body's size the given height is for: its own height, or more for a stance wider than MAX_WIDTH of it */
  private get fitH(): number {
    return Math.max(this.a.bodyH, this.a.bodyW / MAX_WIDTH);
  }

  widthFor(height: number): number {
    return (height * this.a.bodyW) / this.fitH;
  }

  resize(height: number, pixelScale: number): boolean {
    const f = this.frame;
    let k = (height * pixelScale) / this.fitH;
    k = Math.min(k, MAX_SIDE / Math.max(f.w, f.h));
    const w = Math.max(2, Math.round(f.w * k));
    const h = Math.max(2, Math.round(f.h * k));
    this.k = k;
    this.px = (k * this.fitH) / height;
    if (w === this.canvas.width && h === this.canvas.height) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.texture.source.resize(w, h);
    return true;
  }

  get clip(): VideoClip {
    return this.clipName;
  }

  /** a clip that does not loop has reached its end (death then holds) */
  get finished(): boolean {
    return this.clipName !== 'idle' && this.ended;
  }

  get remaining(): number {
    return this.clipName === 'idle' ? 0 : Math.max(0, this.dur - this.t);
  }

  /** The clip's own URL: the variant's ("strike:shotgun") when it has one, else the plain clip's. */
  private srcOf(clip: VideoClip, variant?: string): string | undefined {
    return (variant && this.a.clips[`${clip}:${variant}`]) || this.a.clips[clip];
  }

  /** Seconds from the start of a clip to its moment (a strike's impact), so the board waits for it and no longer. */
  momentIn(clip: VideoClip, variant?: string): number {
    if (clip === 'idle') return 0;
    const src = this.srcOf(clip, variant);
    const v = src ? this.own.get(src) : undefined;
    if (v && v.readyState >= 2 && v.duration > 0)
      return v.duration * (src ? (impacts.get(src) ?? MADE[clip].at) : MADE[clip].at);
    return MADE[clip].dur * MADE[clip].at;
  }

  play(
    clip: VideoClip,
    opts: { onEvent?: (e: { name: string }) => void; onEnd?: () => void; variant?: string } = {},
  ): void {
    if (this.disposed) return;
    // (a clip cut short still says it ended, so nothing waits for it)
    const was = this.onEnd;
    this.onEnd = undefined;
    if (this.clipName !== 'idle' && !this.ended) was?.();
    this.clipName = clip;
    this.t = 0;
    this.gameT = 0;
    this.fired = false;
    this.ended = false;
    this.onEvent = opts.onEvent;
    this.onEnd = opts.onEnd;
    this.madeUp = false;
    if (clip === 'idle') {
      this.show(this.idle);
      this.dur = 0;
      return;
    }
    const src = this.srcOf(clip, opts.variant);
    const v = src ? this.own.get(src) : undefined;
    // (its own video once it can play; until then, and for a clip with none, the idle video with the canvas's own motion)
    if (src && v && v.readyState >= 2 && v.duration > 0) {
      v.currentTime = 0;
      v.playbackRate = 1;
      this.show(v);
      this.dur = v.duration;
      this.at = impacts.get(src) ?? MADE[clip].at;
    } else {
      this.show(this.idle);
      this.madeUp = true;
      this.dur = MADE[clip].dur;
      this.at = MADE[clip].at;
    }
  }

  private show(v: HTMLVideoElement): void {
    if (this.current !== v && this.current !== this.idle) this.current.pause();
    this.current = v;
    void v.play().catch(() => undefined);
  }

  /** when update last ran (real time), to play a clip's own video at the game's pace */
  private lastTick = 0;
  /** game time since the clip began: a clip whose video stalls still ends a little after it should have */
  private gameT = 0;

  update(dt: number): void {
    const now = performance.now();
    const real = this.lastTick ? (now - this.lastTick) / 1000 : 0;
    this.lastTick = now;
    if (this.disposed || dt <= 0 || this.clipName === 'idle' || this.ended) return;
    // (a clip's own video plays at the game's pace, the speed setting and a heavy blow's hold included, so the board's timers and
    // the video agree; its moments and end follow the video. A clip the canvas makes up follows the game's time)
    if (!this.madeUp && real > 0.001 && real < 0.25) {
      const rate = Math.min(4, Math.max(0.0625, dt / real));
      if (Math.abs(this.current.playbackRate - rate) > 0.05) this.current.playbackRate = rate;
    }
    this.gameT += dt;
    this.t = this.madeUp
      ? this.t + dt
      : this.current.ended || this.gameT > this.dur * 1.5 + 0.25
        ? this.dur
        : this.current.currentTime;
    const made = MADE[this.clipName];
    if (!this.fired && this.t >= this.dur * this.at) {
      this.fired = true;
      this.onEvent?.({ name: made.event });
    }
    if (this.t >= this.dur) {
      this.ended = true;
      const end = this.onEnd;
      this.onEnd = undefined;
      // (death holds its last frame; every other clip goes back to the idle loop)
      if (this.clipName === 'death') this.current.pause();
      else {
        this.clipName = 'idle';
        this.madeUp = false;
        this.show(this.idle);
      }
      end?.();
    }
  }

  /** The canvas's own motion for a clip with no video: how far to move, turn and tint the figure, and how visible it is. */
  private motion(): {
    dx: number;
    dy: number;
    turn: number;
    tint: [number, number, number, number];
    alpha: number;
  } {
    const rest = {
      dx: 0,
      dy: 0,
      turn: 0,
      tint: [1, 1, 1, 0] as [number, number, number, number],
      alpha: 1,
    };
    const clip = this.clipName;
    if (clip === 'idle' || !this.madeUp) return rest;
    const u = Math.min(1, this.t / Math.max(0.01, this.dur));
    const body = this.a.bodyH;
    if (clip === 'strike') return { ...rest, dx: body * 0.22 * Math.sin(Math.PI * u) };
    if (clip === 'hit')
      return {
        ...rest,
        dx: -body * 0.03 * Math.sin(u * 40) * (1 - u),
        tint: [1, 1, 1, 0.55 * (1 - u)],
      };
    if (clip === 'aura') return { ...rest, tint: [1, 0.85, 0.45, 0.35 * Math.sin(Math.PI * u)] };
    // (death: tips back from the feet and sinks a little, and stays down dimmed)
    const e = 1 - (1 - u) ** 3;
    return { ...rest, dy: body * 0.04 * e, turn: -0.5 * e, alpha: 1 - 0.35 * e };
  }

  render(): void {
    if (this.disposed) return;
    const gl = this.gl;
    // (until this sprite's own video can play, the loaded one's first frame stands in)
    const v = this.current.readyState >= 2 ? this.current : this.a.idle;
    const { width: cw, height: ch } = this.canvas;
    gl.viewport(0, 0, cw, ch);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (v.readyState < 2) {
      this.texture.source.update();
      return;
    }
    gl.useProgram(this.prog);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
    const m = this.motion();
    // video px -> canvas px: the frame's origin moved to the canvas's, scaled by k; then the motion about the feet; then clip space
    const f = this.frame;
    const [fx, fy] = this.a.feet;
    // (every clip is framed as the idle loop is: drawn to the idle video's size, whatever its own resolution)
    const { w: vw, h: vh } = this.a.size;
    const k = this.k;
    const cos = Math.cos(m.turn);
    const sin = Math.sin(m.turn);
    // (a unit quad -> the video's rectangle in canvas px, about the feet, turned, moved; then mirrored for a hero facing left)
    const ax = (fx - f.x0) * this.k;
    const ay = (fy - f.y0) * this.k;
    const toCanvas = (u: number, w: number): [number, number] => {
      const px = (u * vw - fx) * k;
      const py = (w * vh - fy) * k;
      const rx = px * cos - py * sin + m.dx * k;
      const ry = px * sin + py * cos + m.dy * k;
      return [ax + rx, ay + ry];
    };
    const o = toCanvas(0, 0);
    const ex = toCanvas(1, 0);
    const ey = toCanvas(0, 1);
    const mirror = this.facing === 'left';
    const clipX = (x: number): number => {
      const cx = mirror ? cw - x : x;
      return (cx / cw) * 2 - 1;
    };
    const clipY = (y: number): number => 1 - (y / ch) * 2;
    // (column-major 3x3: the quad's u axis, its v axis, its origin, all in clip space)
    const mat = new Float32Array([
      clipX(ex[0]) - clipX(o[0]),
      clipY(ex[1]) - clipY(o[1]),
      0,
      clipX(ey[0]) - clipX(o[0]),
      clipY(ey[1]) - clipY(o[1]),
      0,
      clipX(o[0]),
      clipY(o[1]),
      1,
    ]);
    gl.uniformMatrix3fv(this.loc.m, false, mat);
    gl.uniform3f(this.loc.key, ...this.a.key);
    gl.uniform4f(this.loc.tint, ...m.tint);
    gl.uniform1f(this.loc.alpha, m.alpha);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.texture.source.update();
  }

  onLost(lost: () => void): void {
    this.canvas.addEventListener('webglcontextlost', () => lost(), { once: true });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    // (its own videos go; the loaded stand-in stays for the next sprite of this hero)
    for (const v of [this.idle, ...this.own.values()]) {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
    this.texture.destroy(true);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/** Where in a strike clip its blow lands, as a share of it: the frame the body reaches furthest forward. */
const impacts = new Map<string, number>();
const measuring = new Set<string>();
async function impactOf(src: string, key: [number, number, number]): Promise<void> {
  if (impacts.has(src) || measuring.has(src)) return;
  measuring.add(src);
  const v = video(src, false);
  try {
    await new Promise<void>((resolve, reject) => {
      v.addEventListener('loadeddata', () => resolve(), { once: true });
      window.setTimeout(() => reject(new Error('slow')), 15000);
      v.addEventListener('error', () => reject(new Error('video')), { once: true });
    });
    const w = 160;
    const h = Math.max(8, Math.round((v.videoHeight / v.videoWidth) * w));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g || !(v.duration > 0)) return;
    const k = key.map((x) => x * 255);
    let best = -1;
    let at = MADE.strike.at;
    const STEPS = 16;
    for (let i = 1; i < STEPS; i++) {
      const t = (v.duration * i) / STEPS;
      await new Promise<void>((resolve) => {
        v.addEventListener('seeked', () => resolve(), { once: true });
        window.setTimeout(resolve, 2000);
        v.currentTime = t;
      });
      // (a seek is done before its frame is on show: wait for that frame, or every sample reads the same picture)
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, 150);
        const frames = v as HTMLVideoElement & {
          requestVideoFrameCallback?: (this: HTMLVideoElement, cb: () => void) => number;
        };
        if (typeof frames.requestVideoFrameCallback === 'function')
          frames.requestVideoFrameCallback(() => {
            clearTimeout(timer);
            resolve();
          });
      });
      g.drawImage(v, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      // (the furthest column, facing right, with a few pixels that are not the key colour in it; the frame's own edge, where an
      // encoder may leave a dark line, is left out)
      let reach = -1;
      for (let x = w - 4; x >= 3 && reach < 0; x--) {
        let n = 0;
        for (let y = 3; y < h - 3; y++) {
          const j = (y * w + x) * 4;
          if (
            Math.abs(d[j]! - k[0]!) + Math.abs(d[j + 1]! - k[1]!) + Math.abs(d[j + 2]! - k[2]!) >
            150
          )
            n++;
        }
        if (n >= 3) reach = x;
      }
      if (reach > best) {
        best = reach;
        at = i / STEPS;
      }
    }
    impacts.set(src, at);
  } catch {
    /* the default moment stands */
  } finally {
    measuring.delete(src);
    v.removeAttribute('src');
    v.load();
  }
}

function program(gl: WebGL2RenderingContext): WebGLProgram {
  const shader = (type: number, src: string): WebGLShader => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  return p;
}
