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
  /** the idle's first frame as a small silhouette, to line every other clip up with it (fitOf) */
  mask: Mask | null;
}

/** A frame's silhouette at a small size: which pixels are not the key colour, and the list of them. */
interface Mask {
  w: number;
  h: number;
  /** the video's own size, for going back to video px */
  vw: number;
  vh: number;
  solid: Uint8Array;
  pts: Int16Array;
}

/**
 * Where a clip's video stands in the idle video's px: its top-left corner and the scale of a clip px. The clips are made from the
 * same first frame as the idle, but some were cut or encoded at another size and framing (an 854x480 idle beside 960x540 clips, the
 * figure 4-5% lower and bigger in them): drawn at the idle's size as they are, the figure jumped when an attack began and back when
 * it ended. Each clip's first frame is matched to the idle's so the figure stays where it stood.
 */
interface Fit {
  x: number;
  y: number;
  s: number;
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
        mask: maskOf(idle, measured.key),
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
  const key = keyIn(d, w, h);
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
  // (the feet stand under the body, not under everything in the frame: a spear, staff or drone held out to one side would pull the
  // box's middle its way. The middle of what stands in the box's bottom strip, the legs, is where they are)
  const band = Math.max(2, Math.round((y1 - y0 + 1) * 0.12));
  let sum = 0;
  let count = 0;
  for (let y = y1 - band + 1; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const [r, gr, b] = at(x, y);
      if (Math.abs(r - key[0]) + Math.abs(gr - key[1]) + Math.abs(b - key[2]) < 150) continue;
      sum += x;
      count++;
    }
  const feetX = count ? sum / count : (x0 + x1) / 2;
  const solid = (x: number, y: number): boolean => {
    const [r, gr, b] = at(x, y);
    return Math.abs(r - key[0]) + Math.abs(gr - key[1]) + Math.abs(b - key[2]) >= 150;
  };
  // (the body's size, so every hero stands as tall as the next whatever they hold: its height up a strip over the feet, to the top of
  // the head (a staff raised to one side, a hawk overhead or a cape is not counted), and its stance, how wide the feet stand)
  const half = Math.max(2, Math.round((y1 - y0 + 1) * 0.1));
  let top = y1;
  for (let y = y0; y <= y1; y++) {
    let n = 0;
    for (
      let x = Math.max(x0, Math.round(feetX) - half);
      x <= Math.min(x1, Math.round(feetX) + half);
      x++
    )
      if (solid(x, y)) n++;
    if (n >= 2) {
      top = y;
      break;
    }
  }
  let s0 = x1;
  let s1 = x0;
  for (let y = y1 - band + 1; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (solid(x, y)) {
        s0 = Math.min(s0, x);
        s1 = Math.max(s1, x);
      }
  const bodyH = Math.max(1, y1 - top + 1);
  return {
    key: [key[0] / 255, key[1] / 255, key[2] / 255],
    feet: [feetX / scale, (y1 + 1) / scale],
    bodyH: bodyH / scale,
    // (at least half its height: a figure standing with its feet together still takes its room in the line)
    bodyW: Math.max(bodyH * 0.5, s1 - s0 + 1) / scale,
  };
}

/** The key colour of a frame's pixels, 0-255: the corner most like the others. */
function keyIn(d: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const at = (x: number, y: number): [number, number, number] => {
    const i = (y * w + x) * 4;
    return [d[i]!, d[i + 1]!, d[i + 2]!];
  };
  // (a few pixels in from the frame's edge, where an encoder may leave a dark line)
  const corners = [at(4, 4), at(w - 5, 4), at(4, h - 5), at(w - 5, h - 5)];
  // (the corner most like the others: a weapon or cape reaching one corner does not move the key)
  const near = (p: number[], q: number[]): number =>
    Math.abs(p[0]! - q[0]!) + Math.abs(p[1]! - q[1]!) + Math.abs(p[2]! - q[2]!);
  return [...corners].sort(
    (p, q) =>
      corners.reduce((n, o) => n + near(p, o), 0) - corners.reduce((n, o) => n + near(q, o), 0),
  )[0]!;
}

/** the width of the silhouettes clips are lined up by */
const MASK_W = 128;

/** The frame on show as a small silhouette (its own key colour when `key` is not given, 0-1 otherwise). */
function maskOf(v: HTMLVideoElement, key?: [number, number, number]): Mask | null {
  if (!v.videoWidth || !v.videoHeight) return null;
  const w = MASK_W;
  const h = Math.max(8, Math.round((v.videoHeight / v.videoWidth) * w));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(v, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const k = key ? key.map((x) => x * 255) : keyIn(d, w, h);
  const solid = new Uint8Array(w * h);
  const pts: number[] = [];
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const i = (y * w + x) * 4;
      if (Math.abs(d[i]! - k[0]!) + Math.abs(d[i + 1]! - k[1]!) + Math.abs(d[i + 2]! - k[2]!) < 150)
        continue;
      solid[y * w + x] = 1;
      pts.push(x, y);
    }
  if (pts.length < 40) return null;
  return { w, h, vw: v.videoWidth, vh: v.videoHeight, solid, pts: Int16Array.from(pts) };
}

/**
 * Where a clip's first frame lines up with the idle's (both silhouettes): the scale and offset, in the idle video's px, that lay the
 * most of each on the other. Searched near "the same framing" (the clip drawn to the idle's size), coarse then fine; a clip already
 * framed as the idle is comes out as it is.
 */
function fitTo(idle: Mask, clip: Mask): Fit {
  // (silhouette px: idle = s * clip + t)
  const s0 = idle.w / clip.w;
  const score = (s: number, tx: number, ty: number): number => {
    let a = 0;
    const cp = clip.pts;
    for (let i = 0; i < cp.length; i += 2) {
      const x = Math.round(s * cp[i]! + tx);
      const y = Math.round(s * cp[i + 1]! + ty);
      if (x >= 0 && y >= 0 && x < idle.w && y < idle.h && idle.solid[y * idle.w + x]) a++;
    }
    let b = 0;
    const ip = idle.pts;
    for (let i = 0; i < ip.length; i += 2) {
      const x = Math.round((ip[i]! - tx) / s);
      const y = Math.round((ip[i + 1]! - ty) / s);
      if (x >= 0 && y >= 0 && x < clip.w && y < clip.h && clip.solid[y * clip.w + x]) b++;
    }
    return a / (cp.length / 2) + b / (ip.length / 2);
  };
  let best = { s: s0, tx: 0, ty: 0, v: score(s0, 0, 0) };
  const search = (ss: number[], txs: number[], tys: number[]): void => {
    for (const s of ss)
      for (const tx of txs)
        for (const ty of tys) {
          const v = score(s, tx, ty);
          if (v > best.v + 1e-9) best = { s, tx, ty, v };
        }
  };
  const range = (mid: number, half: number, step: number): number[] => {
    const out: number[] = [];
    for (let x = mid - half; x <= mid + half + 1e-9; x += step) out.push(x);
    return out;
  };
  // (up to 12% bigger or smaller, and 5% of the frame either way: the clips cut at another size are about 3-4% bigger and a pixel or
  // two off at this size. About 50 ms a clip, once a session)
  const R = Math.round(idle.w * 0.05);
  search(range(s0, s0 * 0.12, s0 * 0.02), range(0, R, 2), range(0, R, 2));
  let c = best;
  search(range(c.s, s0 * 0.02, s0 * 0.005), range(c.tx, 2, 0.5), range(c.ty, 2, 0.5));
  c = best;
  search(range(c.s, s0 * 0.005, s0 * 0.0025), range(c.tx, 0.5, 0.25), range(c.ty, 0.5, 0.25));
  // (a clip whose framing barely differs is left exactly as it is: no half-pixel wobble between clips that already agree)
  const same = score(s0, 0, 0);
  if (best.v - same < 0.01) best = { s: s0, tx: 0, ty: 0, v: same };
  // silhouette px -> video px: idle video px = (s * clip video px * clip.w / clip.vw + t) * idle.vw / idle.w
  const ki = idle.vw / idle.w;
  const kc = clip.w / clip.vw;
  return { x: best.tx * ki, y: best.ty * ki, s: best.s * kc * ki };
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
/** how long one clip fades into the next (seconds): the idle into an attack, the attack's end back into the idle */
const FADE = 0.16;
/** the widest a model may stand, as a share of the height it is given: a wide stance is drawn smaller to fit, as a painting would be */
const MAX_WIDTH = 0.85;
/** how much of the height a figure is given its body fills: a painting's height takes in its hat, weapon and cape too, so the body alone
 * is drawn a little shorter than it, the same share for every hero */
const BODY_SHARE = 0.78;

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
  /** each clip video's URL, for its Fit */
  private readonly srcOfVideo = new Map<HTMLVideoElement, string>();
  /** the second texture: the video being faded out, drawn over the new one while it fades */
  private readonly tex2: WebGLTexture;
  /** the video a change of clip fades out of (the idle as an attack begins, the attack's last frame as the idle comes back) */
  private fadeFrom: HTMLVideoElement | null = null;
  private fadeT = 0;
  /** how long the fade has waited for the new video's first frame (a seek still under way) */
  private fadeWait = 0;

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
    this.tex2 = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.idle = video(a.idle.currentSrc || a.idle.src, true);
    this.current = this.idle;
    void this.idle.play().catch(() => undefined);
    for (const src of new Set(Object.values(a.clips))) {
      if (!src) continue;
      const v = video(src, false);
      this.own.set(src, v);
      this.srcOfVideo.set(v, src);
      // (where each clip lines up with the idle, from this copy's first frame; and where a strike lands in its own clip: measured once
      // from its frames, while the idle plays)
      if (v.readyState >= 2) fitFrom(v, src, a);
      else v.addEventListener('loadeddata', () => fitFrom(v, src, a), { once: true });
      if (/strike/.test(src)) void study(src, a);
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
    return Math.max(this.a.bodyH / BODY_SHARE, this.a.bodyW / MAX_WIDTH);
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
      this.backToIdle();
      this.dur = 0;
      return;
    }
    const src = this.srcOf(clip, opts.variant);
    const v = src ? this.own.get(src) : undefined;
    // (its own video once it can play and is lined up with the idle; until then, and for a clip with none, the idle video with the
    // canvas's own motion: a fit landing partway through a swing would move the figure then)
    if (src && v && v.readyState >= 2 && v.duration > 0 && fits.has(src)) {
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

  /**
   * The idle loop again after a clip of its own: from its first frame, the pose every clip starts and ends on, so the figure does not
   * snap to wherever the loop had got to meanwhile. (A clip played on the idle video itself carries on with it.)
   */
  private backToIdle(): void {
    if (this.current !== this.idle) {
      try {
        this.idle.currentTime = 0;
      } catch {
        /* not seekable yet: it carries on where it is */
      }
    }
    this.show(this.idle);
  }

  /** The video shown from now on, faded in over the one shown until now (FADE), which holds where it was if it was a clip. */
  private show(v: HTMLVideoElement): void {
    const from = this.current;
    if (from !== v) {
      if (from !== this.idle) from.pause();
      // (only a frame that is on show can be faded out of)
      this.fadeFrom = from.readyState >= 2 ? from : null;
      this.fadeT = 0;
      this.fadeWait = 0;
    }
    this.current = v;
    void v.play().catch(() => undefined);
  }

  /** a change of clip is still fading (a board that holds still keeps updating until it is done) */
  get fading(): boolean {
    return !!this.fadeFrom;
  }

  /** Whether a clip plays its own video now (the screens outside battle wait for it rather than play the canvas's stand-in lunge). */
  ready(clip: VideoClip, variant?: string): boolean {
    if (clip === 'idle') return true;
    const src = this.srcOf(clip, variant);
    const v = src ? this.own.get(src) : undefined;
    return !!src && !!v && v.readyState >= 2 && v.duration > 0 && fits.has(src);
  }

  /** when update last ran (real time), to play a clip's own video at the game's pace */
  private lastTick = 0;
  /** game time since the clip began: a clip whose video stalls still ends a little after it should have */
  private gameT = 0;

  update(dt: number): void {
    const now = performance.now();
    const real = this.lastTick ? (now - this.lastTick) / 1000 : 0;
    this.lastTick = now;
    // (a fade runs in real time, whatever the game's speed; it starts once the new video shows its frame, or after a short wait)
    if (this.fadeFrom) {
      const step = Math.min(0.1, real);
      const shown = this.current.readyState >= 2 && !this.current.seeking;
      if (shown || (this.fadeWait += step) > 0.3) this.fadeT += step;
      if (this.fadeT >= FADE) this.fadeFrom = null;
    }
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
        this.backToIdle();
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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.uniform3f(this.loc.key, ...this.a.key);
    this.draw(v, this.tex, this.motion());
    // (a change of clip: the video it came from on top, fading out, so the figure turns into the new clip instead of jumping to it)
    const from = this.fadeFrom;
    if (from && from !== v && from.readyState >= 2) {
      const u = Math.min(1, this.fadeT / FADE);
      // (eased: most of the change in the middle of the fade)
      const out = 1 - u * u * (3 - 2 * u);
      this.draw(from, this.tex2, {
        dx: 0,
        dy: 0,
        turn: 0,
        tint: [1, 1, 1, 0],
        alpha: out,
      });
    }
    this.texture.source.update();
  }

  /** Where a video's frame stands in the idle video's px: the idle itself as it is, a clip by its Fit (as the idle when unmeasured). */
  private rectOf(v: HTMLVideoElement): { x: number; y: number; w: number; h: number } {
    const { w, h } = this.a.size;
    const src = this.srcOfVideo.get(v);
    const fit = src ? fits.get(src) : undefined;
    if (!fit || !v.videoWidth) return { x: 0, y: 0, w, h };
    return { x: fit.x, y: fit.y, w: v.videoWidth * fit.s, h: v.videoHeight * fit.s };
  }

  /** One video's frame onto the canvas, keyed, moved by the canvas's own motion about the feet. */
  private draw(
    v: HTMLVideoElement,
    tex: WebGLTexture,
    m: ReturnType<VideoHeroSprite['motion']>,
  ): void {
    const gl = this.gl;
    const { width: cw, height: ch } = this.canvas;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
    // video px -> canvas px: the frame's origin moved to the canvas's, scaled by k; then the motion about the feet; then clip space
    const f = this.frame;
    const [fx, fy] = this.a.feet;
    // (every clip is framed as the idle loop is: drawn where its first frame lies over the idle's, whatever its own resolution)
    const r = this.rectOf(v);
    const k = this.k;
    const cos = Math.cos(m.turn);
    const sin = Math.sin(m.turn);
    // (a unit quad -> the video's rectangle in canvas px, about the feet, turned, moved; then mirrored for a hero facing left)
    const ax = (fx - f.x0) * this.k;
    const ay = (fy - f.y0) * this.k;
    const toCanvas = (u: number, w: number): [number, number] => {
      const px = (r.x + u * r.w - fx) * k;
      const py = (r.y + w * r.h - fy) * k;
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
    gl.uniform4f(this.loc.tint, ...m.tint);
    gl.uniform1f(this.loc.alpha, m.alpha);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
/** where each clip stands in its hero's idle video (Fit), by clip URL; null when it could not be measured (drawn as the idle is) */
const fits = new Map<string, Fit | null>();
const measuring = new Set<string>();
const fittingNow = new Set<string>();
/** the line clips wait in for their fit, one at a time */
let fitting: Promise<void> = Promise.resolve();

/**
 * Where a clip lines up with the idle, from the sprite's own copy of it once loaded (its first frame is on show until it is played,
 * and it is not played before this is done), so no clip is downloaded a second time for it. One clip at a time, each in a task of its
 * own, so several clips loading together do not stall a frame.
 */
function fitFrom(v: HTMLVideoElement, src: string, a: VideoAssets): void {
  if (fits.has(src) || fittingNow.has(src) || v.readyState < 2) return;
  const first = maskOf(v);
  fittingNow.add(src);
  fitting = fitting
    .then(() => new Promise<void>((r) => window.setTimeout(r, 0)))
    .then(() => {
      // (null: measured, but no silhouette to line up by; drawn as the idle is)
      fits.set(src, first && a.mask ? fitTo(a.mask, first) : null);
    })
    .catch(() => undefined)
    .finally(() => fittingNow.delete(src));
}

/** Where a strike clip's blow lands, once (a copy of its own to seek through; one that fails is tried again by the next sprite). */
async function study(src: string, a: VideoAssets): Promise<void> {
  if (measuring.has(src) || impacts.has(src)) return;
  measuring.add(src);
  const v = video(src, false);
  let timer = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      v.addEventListener('loadeddata', () => resolve(), { once: true });
      timer = window.setTimeout(() => reject(new Error('slow')), 15000);
      v.addEventListener('error', () => reject(new Error('video')), { once: true });
    });
    clearTimeout(timer);
    await impactIn(v, src, a.key);
  } catch {
    /* the default moment stands until then */
  } finally {
    clearTimeout(timer);
    measuring.delete(src);
    v.removeAttribute('src');
    v.load();
  }
}

/** (a loaded strike clip, seeked through: its blow lands on the frame its body reaches furthest forward) */
async function impactIn(
  v: HTMLVideoElement,
  src: string,
  key: [number, number, number],
): Promise<void> {
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
