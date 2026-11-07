/* eslint-disable */
// Vendored from assets-src/heroes/sun-knight-2d/runtime/knight2d.js, wrapped as an ES module: the original attached Knight2D
// to window; here the same code runs against a private scope object and the class is exported. Its logic is unchanged.
const scope = {};
/* Sun Knight 2D — lightweight skeletal cut-out runtime (WebGL2, no dependencies).
 *
 *   const k = new Knight2D(gl, rigJson, atlasImage, KNIGHT_CLIPS);
 *   k.play('strike', {onEvent: e => ...});   // idle | strike | aura | hit | death
 *   each frame: k.update(dt); k.render(viewMatrix3x3)
 *
 * Coordinates are the illustration's pixel space (1105 x 1423, y down). The view matrix maps that space to clip space;
 * Knight2D.viewFor(canvasW, canvasH, scale, anchorX, anchorY) builds one (anchor = where the knight's feet go).
 */
(function (global) {
  'use strict';
  const D2R = Math.PI / 180;
  const EASE = {
    linear: t => t,
    in: t => t * t * t,
    out: t => 1 - Math.pow(1 - t, 3),
    in2: t => t * t,
    out2: t => 1 - (1 - t) * (1 - t),
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    sine: t => 0.5 - 0.5 * Math.cos(Math.PI * t),
    outBack: t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outQuint: t => 1 - Math.pow(1 - t, 5),
    hold: t => (t < 1 ? 0 : 1),
  };

  // ---- 2D affine helpers: [a,b,c,d,e,f] maps (x,y) -> (a x + c y + e, b x + d y + f)
  function mul(m, n) {
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  }
  function local(px, py, r, tx, ty, sx, sy) {
    const c = Math.cos(r * D2R), s = Math.sin(r * D2R);
    // T(p+t) R S T(-p)
    const a = c * sx, b = s * sx, cc = -s * sy, d = c * sy;
    return [a, b, cc, d, px + tx - (a * px + cc * py), py + ty - (b * px + d * py)];
  }
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const ang = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax) / D2R;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ------------------------------------------------------------------------------------------ skeleton + pose
  class Skeleton {
    constructor(rig) {
      this.bones = rig.bones.map((b, i) => ({ ...b, i }));
      this.idx = {}; this.bones.forEach(b => (this.idx[b.name] = b.i));
      const P = n => this.bones[this.idx[n]].pivot;
      const len = (a, b) => Math.hypot(P(b)[0] - P(a)[0], P(b)[1] - P(a)[1]);
      this.legs = {
        n: { hip: 'n_hip', knee: 'n_knee', ankle: 'n_ankle', L1: len('n_hip', 'n_knee'), L2: len('n_knee', 'n_ankle'),
          a1: ang(...P('n_hip'), ...P('n_knee')), a2: ang(...P('n_knee'), ...P('n_ankle')) },
        f: { hip: 'f_hip', knee: 'f_knee', ankle: 'f_ankle', L1: len('f_hip', 'f_knee'), L2: len('f_knee', 'f_ankle'),
          a1: ang(...P('f_hip'), ...P('f_knee')), a2: ang(...P('f_knee'), ...P('f_ankle')) },
      };
      this.world = this.bones.map(() => [1, 0, 0, 1, 0, 0]);
      this.wrot = this.bones.map(() => 0);
    }
    pivot(n) { return this.bones[this.idx[n]].pivot; }
    // pose: {bones:{name:{r,x,y,sx,sy,w}}, feet:{n:{x,y,a,ik}, f:{...}}, follow:{...}}
    solve(pose) {
      const B = pose.bones || {};
      const legBone = {};
      for (const k of ['n', 'f']) { const L = this.legs[k]; legBone[L.hip] = k; }
      const done = {};
      for (const b of this.bones) {
        if (done[b.i]) continue;
        const pw = b.parent >= 0 ? this.world[b.parent] : [1, 0, 0, 1, 0, 0];
        const prot = b.parent >= 0 ? this.wrot[b.parent] : 0;
        const q = B[b.name] || {};
        let r = q.r || 0;
        if (q.w !== undefined) r = q.w - prot;           // world-locked angle (delta from rest orientation)
        if (b.name === 'pauldron') r += clamp(0.26 * (this.wrot[this.idx.n_shoulder] - prot), -32, 22);
        if (b.name === 'fauld') r += clamp(0.4 * (this.wrot[this.idx.n_hip] - prot), -28, 22);
        let ox = q.x || 0, oy = q.y || 0;
        if (b.name === 'fauld') { const nh = B.n_hip || {}; ox += (nh.x || 0); oy += (nh.y || 0); }
        this.wrot[b.i] = prot + r;
        this.world[b.i] = mul(pw, local(b.pivot[0], b.pivot[1], r, ox, oy, q.sx ?? 1, q.sy ?? 1));
        done[b.i] = true;
        if (legBone[b.name]) {                          // two-bone IK for the leg rooted at this hip
          const k = legBone[b.name], L = this.legs[k], F = (pose.feet || {})[k] || {};
          const ik = F.ik ?? 1;
          const iH = this.idx[L.hip], iK = this.idx[L.knee], iA = this.idx[L.ankle];
          const hp = this.pivot(L.hip), ap0 = this.pivot(L.ankle);
          const H = ap(this.world[iH], hp[0], hp[1]);
          // FK values
          const qk = B[L.knee] || {}, qa = B[L.ankle] || {};
          let rK = qk.r || 0, rA = qa.r || 0;
          if (ik > 0) {
            const T = [ap0[0] + (F.x || 0), ap0[1] + (F.y || 0)];
            let dx = T[0] - H[0], dy = T[1] - H[1], d = Math.hypot(dx, dy);
            const dmax = L.L1 + L.L2 - 0.5, dmin = Math.abs(L.L1 - L.L2) + 1;
            d = clamp(d, dmin, dmax);
            const base = Math.atan2(dy, dx) / D2R;
            const a1 = Math.acos(clamp((L.L1 * L.L1 + d * d - L.L2 * L.L2) / (2 * L.L1 * d), -1, 1)) / D2R;
            // two knee solutions: keep the one whose knee points the way the knight faces (judged in pelvis space,
            // so it stays right when the body tilts or lies down)
            const pr = -this.wrot[b.parent] * D2R, cs = Math.cos(pr), sn = Math.sin(pr);
            const side = th => { const kx = L.L1 * Math.cos(th * D2R), ky = L.L1 * Math.sin(th * D2R);
              const lx = kx * cs - ky * sn, ly = kx * sn + ky * cs, ldx = dx * cs - dy * sn, ldy = dx * sn + dy * cs;
              return ldx * ly - ldy * lx; };
            const thigh = side(base - a1) <= side(base + a1) ? base - a1 : base + a1;
            const kx = H[0] + L.L1 * Math.cos(thigh * D2R), ky = H[1] + L.L1 * Math.sin(thigh * D2R);
            const shin = Math.atan2(T[1] - ky, T[0] - kx) / D2R;
            // thigh: current world rot of hip bone must become (thigh - a1rest)
            const hipPar = this.wrot[b.parent];
            const rHipIK = (thigh - L.a1) - hipPar;
            const rHip = (q.r || 0) * (1 - ik) + rHipIK * ik;
            // recompute hip world with the IK rotation
            this.wrot[iH] = hipPar + rHip;
            this.world[iH] = mul(pw, local(b.pivot[0], b.pivot[1], rHip, q.x || 0, q.y || 0, 1, 1));
            const rKIK = (shin - L.a2) - this.wrot[iH];
            rK = rK * (1 - ik) + rKIK * ik;
            const footW = (F.a || 0);
            const rAIK = footW - (this.wrot[iH] + rK);
            rA = rA * (1 - ik) + rAIK * ik;
          }
          const kb = this.bones[iK], ab = this.bones[iA];
          this.wrot[iK] = this.wrot[iH] + rK;
          this.world[iK] = mul(this.world[iH], local(kb.pivot[0], kb.pivot[1], rK, 0, 0, 1, 1));
          this.wrot[iA] = this.wrot[iK] + rA;
          this.world[iA] = mul(this.world[iK], local(ab.pivot[0], ab.pivot[1], rA, 0, 0, 1, 1));
          done[iK] = done[iA] = true;
        }
      }
      return this.world;
    }
    pt(bone, x, y) { return ap(this.world[this.idx[bone]], x, y); }
  }

  // --------------------------------------------------------------------------------------------- clip sampling
  function lerpPose(a, b, t) {
    const out = { bones: {}, feet: {}, fx: {} };
    const names = new Set([...Object.keys(a.bones || {}), ...Object.keys(b.bones || {})]);
    for (const n of names) {
      const p = (a.bones || {})[n] || {}, q = (b.bones || {})[n] || {}, o = {};
      for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) {
        const def = k === 'sx' || k === 'sy' ? 1 : 0;
        const pv = p[k] ?? (k === 'w' ? (q.w ?? 0) : def), qv = q[k] ?? (k === 'w' ? (p.w ?? 0) : def);
        o[k] = pv + (qv - pv) * t;
      }
      out.bones[n] = o;
    }
    for (const k of ['n', 'f']) {
      const p = (a.feet || {})[k] || {}, q = (b.feet || {})[k] || {}, o = {};
      for (const f of ['x', 'y', 'a', 'ik']) { const d = f === 'ik' ? 1 : 0; o[f] = (p[f] ?? d) + ((q[f] ?? d) - (p[f] ?? d)) * t; }
      out.feet[k] = o;
    }
    for (const k of new Set([...Object.keys(a.fx || {}), ...Object.keys(b.fx || {})])) {
      const pv = (a.fx || {})[k] ?? 0, qv = (b.fx || {})[k] ?? 0; out.fx[k] = pv + (qv - pv) * t;
    }
    return out;
  }
  function sampleClip(clip, t) {
    const K = clip.keys;
    if (t <= K[0].t) return lerpPose(K[0].pose, K[0].pose, 0);
    for (let i = 1; i < K.length; i++) {
      if (t <= K[i].t) {
        const u = (t - K[i - 1].t) / (K[i].t - K[i - 1].t);
        return lerpPose(K[i - 1].pose, K[i].pose, (EASE[K[i].ease || 'inOut'])(u));
      }
    }
    const L = K[K.length - 1]; return lerpPose(L.pose, L.pose, 0);
  }

  // --------------------------------------------------------------------------------------------------- GL
  const VS = `#version 300 es
  in vec2 aPos; in vec2 aUV; in vec4 aCol; uniform mat3 uView; out vec2 vUV; out vec4 vCol;
  void main(){ vec3 p = uView * vec3(aPos,1.0); gl_Position = vec4(p.xy,0.0,1.0); vUV=aUV; vCol=aCol; }`;
  const FS_SPRITE = `#version 300 es
  precision mediump float; in vec2 vUV; in vec4 vCol; uniform sampler2D uTex; uniform vec4 uTint; uniform vec4 uAdd; uniform float uAlpha;
  out vec4 o; void main(){ vec4 c = texture(uTex, vUV); c.rgb = mix(c.rgb, uTint.rgb*c.a, uTint.a); c.rgb += uAdd.rgb*uAdd.a*c.a; o = c*uAlpha; }`;
  const FS_FX = `#version 300 es
  precision mediump float; in vec2 vUV; in vec4 vCol; uniform int uMode; out vec4 o;
  void main(){
    float a;
    if(uMode==1){ float r=length(vUV); a = clamp(1.0-r,0.0,1.0); a = a*a*(3.0-2.0*a); }
    else if(uMode==2){ float r=length(vUV); a = smoothstep(1.0,0.55,r); }
    else { a = clamp(1.0-abs(vUV.y),0.0,1.0); a = a*a; a *= clamp(vUV.x,0.0,1.0); }
    o = vCol*a; }`;
  function prog(gl, fs) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    }
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aUV'); gl.bindAttribLocation(p, 2, 'aCol');
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  // ------------------------------------------------------------------------------------------------ knight
  class Knight2D {
    constructor(gl, rig, atlasImg, clips) {
      this.gl = gl; this.rig = rig; this.clips = clips; this.sk = new Skeleton(rig);
      this.layers = rig.layers.map(L => {
        const n = L.pos.length / 2;
        return { name: L.name, n, pos: new Float32Array(L.pos), out: new Float32Array(L.pos.length), uv: new Float32Array(L.uv),
          idx: new Uint16Array(L.idx), bi: new Int32Array(L.bi), bw: new Float32Array(L.bw),
          bpos: L.bpos ? new Float32Array(L.bpos) : null };
      });
      this.pSprite = prog(gl, FS_SPRITE); this.pFx = prog(gl, FS_FX);
      this.u = {}; for (const [p, names] of [[this.pSprite, ['uView', 'uTex', 'uTint', 'uAdd', 'uAlpha']], [this.pFx, ['uView', 'uMode']]])
        for (const n of names) (this.u[n] = this.u[n] || new Map()).set(p, gl.getUniformLocation(p, n));
      const tex = this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasImg);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      for (const L of this.layers) {
        L.vao = gl.createVertexArray(); gl.bindVertexArray(L.vao);
        L.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, L.vbo); gl.bufferData(gl.ARRAY_BUFFER, L.out.byteLength, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const ub = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, L.uv, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.disableVertexAttribArray(2); gl.vertexAttrib4f(2, 1, 1, 1, 1);
        const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, L.idx, gl.STATIC_DRAW);
      }
      this.fxVao = gl.createVertexArray(); gl.bindVertexArray(this.fxVao);
      this.fxBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 8);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
      gl.bindVertexArray(null);
      this.reset();
      this.play('idle');
    }
    reset() {
      this.spr = { tab: 0, tabv: 0, tab2: 0, tab2v: 0, px: null, pvx: 0 };
      this.particles = []; this.trail = []; this.shake = 0; this.shakeT = 0; this.flash = 0; this.time = 0;
    }
    play(name, opts = {}) {
      const c = this.clips[name]; if (!c) throw new Error('no clip ' + name);
      this.clip = c; this.clipName = name; this.t = 0; this.opts = opts; this.firedEv = new Set(); this.trail = [];
      this.onEvent = opts.onEvent || null; this.onEnd = opts.onEnd || null;
    }
    get done() { return !this.clip.loop && this.t >= this.clip.duration; }
    // ---------------------------------------------------------------- simulation
    update(dt) {
      dt = Math.min(dt, 1 / 20);
      const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
      for (let s = 0; s < steps; s++) this._step(h);
    }
    _step(h) {
      this.time += h;
      const c = this.clip;
      let t = this.t + h;
      if (c.loop) t = t % c.duration;
      else if (t >= c.duration) {
        t = c.duration;
        if (!this._ended) { this._ended = true; if (this.onEnd) this.onEnd(this.clipName); if (c.next) { this.play(c.next, { onEvent: this.onEvent }); this._ended = false; return; } }
      }
      if (t < this.t && c.loop) this.firedEv = new Set();
      this.t = t; if (!(t >= c.duration)) this._ended = false;
      const pose = sampleClip(c, t);
      this.pose = pose;
      // secondary motion: tabard pendulum driven by pelvis acceleration
      const S = this.spr;
      const W = this.sk.solve(this._withSprings(pose));
      const hp = this.sk.pt('hips', 556, 726);
      if (S.px === null) { S.px = hp[0]; S.py = hp[1]; S.pvx = 0; S.pvy = 0; }
      const vx = (hp[0] - S.px) / h, vy = (hp[1] - S.py) / h;
      const ax = clamp((vx - S.pvx) / h, -60000, 60000), ay = clamp((vy - S.pvy) / h, -60000, 60000);
      S.px = hp[0]; S.py = hp[1]; S.pvx = vx; S.pvy = vy;
      const hipRot = this.sk.wrot[this.sk.idx.hips];
      const target = -hipRot * 0.85 * (pose.fx.tabHang ?? 1);
      const K = 140, Dm = 9;
      const acc = -K * (S.tab - target) - Dm * S.tabv + ax * 0.0021 + (pose.fx.flutter || 0) * Math.sin(this.time * 23) * 40;
      S.tabv += acc * h; S.tab += S.tabv * h; S.tab = clamp(S.tab, -55, 55);
      const acc2 = -170 * (S.tab2 - S.tab * 0.45) - 8 * S.tab2v + ax * 0.0012 + (pose.fx.flutter || 0) * Math.sin(this.time * 29 + 1) * 50;
      S.tab2v += acc2 * h; S.tab2 += S.tab2v * h; S.tab2 = clamp(S.tab2, -45, 45);
      // events
      for (const e of c.events || []) if (!this.firedEv.has(e) && t >= e.t) { this.firedEv.add(e); this._event(e); }
      // continuous fx
      this._fx(h, pose);
      // particles
      for (const p of this.particles) {
        p.life -= h; p.vy += (p.g || 0) * h; p.vx *= Math.exp(-(p.drag || 0) * h); p.vy *= Math.exp(-(p.drag || 0) * h);
        p.x += p.vx * h; p.y += p.vy * h; if (p.grow) p.size += p.grow * h;
      }
      this.particles = this.particles.filter(p => p.life > 0);
      this.flash = Math.max(0, this.flash - h / 0.16);
      this.shake = Math.max(0, this.shake - h * this.shake / 0.25 - h * 2);
    }
    _withSprings(pose) {
      const p = { bones: { ...pose.bones }, feet: pose.feet, fx: pose.fx };
      const tb = p.bones.tabard || {}, t2 = p.bones.tabard2 || {};
      p.bones.tabard = { ...tb, r: (tb.r || 0) + this.spr.tab };
      p.bones.tabard2 = { ...t2, r: (t2.r || 0) + this.spr.tab2 };
      return p;
    }
    // sword geometry in world space
    swordPts() {
      const W = this.sk.world[this.sk.idx.n_wrist];
      return { base: ap(W, 478, 610), tip: ap(W, 998, 172), mid: ap(W, 740, 390), grip: ap(W, 385, 705) };
    }
    _emit(n, f) { for (let i = 0; i < n; i++) this.particles.push(f(i)); }
    _event(e) {
      if (this.onEvent) this.onEvent(e);
      const R = Math.random, sw = this.swordPts();
      if (e.fx === 'impact') {           // sword thrust connects
        this.shake = Math.max(this.shake, 14);
        const [x, y] = sw.tip;
        this._emit(26, () => { const a = (R() - 0.5) * 1.9, v = 900 + R() * 1500;
          return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.18 + R() * 0.22, max: 0.4, size: 7 + R() * 9, col: [1, 0.85, 0.45, 1], add: 1, drag: 6, streak: 1 }; });
        this._emit(1, () => ({ x, y, vx: 0, vy: 0, life: 0.16, max: 0.16, size: 170, grow: 900, col: [1, 0.95, 0.75, 0.9], add: 1, mode: 1 }));
      }
      if (e.fx === 'aura') {
        this.shake = Math.max(this.shake, 9);
        const [x, y] = sw.tip;
        this._emit(1, () => ({ x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 120, grow: 1600, col: [1, 0.9, 0.55, 0.95], add: 1, mode: 1 }));
        this._emit(40, () => { const a = R() * Math.PI * 2, v = 500 + R() * 1300;
          return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3 + R() * 0.4, max: 0.7, size: 6 + R() * 8, col: [1, 0.85, 0.4, 1], add: 1, drag: 4, streak: 1 }; });
        const g = this.sk.pt('root', 540, 1385);
        this._emit(1, () => ({ x: g[0], y: g[1], vx: 0, vy: 0, life: 0.55, max: 0.55, size: 80, grow: 1500, col: [1, 0.8, 0.35, 0.8], add: 1, mode: 2, flat: 0.22 }));
      }
      if (e.fx === 'hit') {             // incoming blow on the shield
        this.flash = 1; this.shake = Math.max(this.shake, 16);
        const p = this.sk.pt('f_hand', 860, 590);
        this._emit(22, () => { const a = Math.PI + (R() - 0.5) * 2.4, v = 700 + R() * 1300;
          return { x: p[0] + 120, y: p[1], vx: -Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.15 + R() * 0.25, max: 0.4, size: 6 + R() * 7, col: [1, 0.9, 0.6, 1], add: 1, drag: 5, g: 2500, streak: 1 }; });
        this._emit(1, () => ({ x: p[0] + 100, y: p[1], vx: 0, vy: 0, life: 0.14, max: 0.14, size: 150, grow: 1200, col: [1, 1, 0.9, 0.9], add: 1, mode: 1 }));
      }
      if (e.fx === 'thud') {            // body hits the ground
        this.shake = Math.max(this.shake, e.k || 18);
        const pts = (e.at || [[0, 0]]).map(([bx, by, bone]) => this.sk.pt(bone || 'root', bx, by));
        for (const q of pts) this._emit(14, () => { const dir = R() < 0.5 ? -1 : 1, v = 150 + R() * 420;
          return { x: q[0] + (R() - 0.5) * 120, y: q[1] - R() * 20, vx: dir * v, vy: -R() * 160, life: 0.6 + R() * 0.6, max: 1.2, size: 40 + R() * 50, grow: 90,
            col: [0.55, 0.5, 0.45, 0.35], add: 0, drag: 3, g: -60, mode: 1 }; });
      }
      if (e.fx === 'flash') this.flash = e.k || 1;
      if (e.fx === 'shake') this.shake = Math.max(this.shake, e.k || 10);
    }
    _fx(h, pose) {
      const fx = pose.fx, R = Math.random;
      // sword trail sampling
      if ((fx.trail || 0) > 0.01) {
        const s = this.swordPts();
        this.trail.push({ a: s.mid, b: s.tip, t: this.time, k: fx.trail });
      }
      this.trail = this.trail.filter(p => this.time - p.t < 0.12);
      // aura embers
      if ((fx.aura || 0) > 0.05) {
        const n = fx.aura * 260 * h; let k = Math.floor(n) + (R() < n % 1 ? 1 : 0);
        while (k--) {
          const b = this.sk.pt('hips', 380 + R() * 400, 300 + R() * 1050);
          this.particles.push({ x: b[0], y: b[1], vx: (R() - 0.5) * 60, vy: -200 - R() * 380, life: 0.6 + R() * 0.8, max: 1.4, size: 5 + R() * 7,
            col: [1, 0.78 + R() * 0.2, 0.35, 1], add: 1, drag: 0.6, twinkle: 1 });
        }
      }
    }
    // ---------------------------------------------------------------- rendering
    static viewFor(w, h, scale, ax, ay, shx = 0, shy = 0) {
      // illustration px -> clip. anchor (ax,ay) in canvas px is where illustration point (540,1385) lands.
      const sx = 2 * scale / w, sy = -2 * scale / h;
      const tx = (ax + shx - 540 * scale) * 2 / w - 1, ty = 1 - (ay + shy - 1385 * scale) * 2 / h;
      return new Float32Array([sx, 0, 0, 0, sy, 0, tx, ty, 1]);
    }
    shakeOffset() { const s = this.shake, t = this.time * 60; return [Math.sin(t * 1.7) * s * 0.6, Math.cos(t * 2.3) * s * 0.5]; }
    render(view, opts = {}) {
      const gl = this.gl, sk = this.sk, W = sk.world, fx = (this.pose && this.pose.fx) || {};
      gl.enable(gl.BLEND);
      // shadow
      const hipsP = sk.pt('hips', 550, 745);
      const feetX = (sk.pt('n_ankle', 170, 1226)[0] + sk.pt('f_ankle', 792, 1228)[0]) / 2;
      const lift = clamp((1385 - Math.max(sk.pt('n_ankle', 150, 1360)[1], sk.pt('f_ankle', 900, 1330)[1])) / 400, 0, 1);
      const sw = 520 + (fx.shadowW || 0);
      this._quads(view, [{ x: (hipsP[0] * 0.5 + feetX * 0.5) + 20, y: 1378 + (fx.shadowY || 0), size: sw * (1 - lift * 0.3), flat: 0.13, col: [0, 0, 0, 0.42 * (1 - lift * 0.5) * (opts.alpha ?? 1)], mode: 1 }], false);
      // aura back glow
      if ((fx.aura || 0) > 0.01 || (fx.glow || 0) > 0.01) {
        const c = sk.pt('chest', 530, 480), a = Math.max(fx.aura || 0, fx.glow || 0);
        const sp = this.swordPts();
        this._quads(view, [
          { x: c[0], y: c[1] + 150, size: 900, col: [1, 0.72, 0.28, 0.33 * a], mode: 1 },
          { x: sp.tip[0], y: sp.tip[1], size: 330 * (0.8 + 0.2 * Math.sin(this.time * 30)), col: [1, 0.9, 0.6, 0.7 * a], mode: 1 },
        ], true);
        // light pillar from the tip upward
        if ((fx.pillar || 0) > 0.01) this._pillar(view, sp.tip, fx.pillar);
      }
      // character
      gl.useProgram(this.pSprite);
      gl.uniformMatrix3fv(this.u.uView.get(this.pSprite), false, view);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(this.u.uTex.get(this.pSprite), 0);
      const fl = Math.max(this.flash, fx.white || 0);
      gl.uniform4f(this.u.uTint.get(this.pSprite), 1, 1, 1, Math.min(1, fl) * 0.62);
      gl.uniform4f(this.u.uAdd.get(this.pSprite), 1.0, 0.72, 0.25, (fx.rim || 0) * 0.55);
      gl.uniform1f(this.u.uAlpha.get(this.pSprite), opts.alpha ?? 1);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      let order = this.layers;
      if ((fx.shieldBehind || 0) > 0.5) {
        // shield drops behind the body but stays in front of its own arm (it hides the gauntlet-less forearm end)
        const sh = this.layers.find(L => L.name === 'shield'), rest = this.layers.filter(L => L.name !== 'shield');
        const ai = rest.findIndex(L => L.name === 'far_arm');
        order = [...rest.slice(0, ai + 1), sh, ...rest.slice(ai + 1)];
      }
      // right leg attachment swap: profile art (toe forward) while the leg is stepped out in front
      const fwd = clamp(fx.nfwd || 0, 0, 1) > 0.5;
      for (const L of order) {
        if (L.name === 'near_leg' && fwd) continue;
        if (L.name === 'near_leg_fwd' && !fwd) continue;
        const o = L.out, p = L.pos, bi = L.bi, bw = L.bw, bp = L.bpos;
        for (let v = 0; v < L.n; v++) {
          let x = p[2 * v], y = p[2 * v + 1];
          let ox = 0, oy = 0;
          for (let k = 0; k < 2; k++) {
            const w = bw[2 * v + k]; if (w === 0) continue;
            if (bp) { x = bp[4 * v + 2 * k]; y = bp[4 * v + 2 * k + 1]; }
            const m = W[bi[2 * v + k]];
            ox += w * (m[0] * x + m[2] * y + m[4]); oy += w * (m[1] * x + m[3] * y + m[5]);
          }
          o[2 * v] = ox; o[2 * v + 1] = oy;
        }
        gl.bindVertexArray(L.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, L.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, o);
        gl.drawElements(gl.TRIANGLES, L.idx.length, gl.UNSIGNED_SHORT, 0);
      }
      gl.bindVertexArray(null);
      // sword trail + particles (additive)
      if (this.trail.length > 1) this._trail(view);
      const add = [], norm = [];
      for (const p of this.particles) {
        const k = clamp(p.life / p.max, 0, 1);
        let a = p.col[3] * (p.add ? Math.pow(k, 0.7) : k);
        if (p.twinkle) a *= 0.6 + 0.4 * Math.sin(this.time * 40 + p.x);
        const q = { x: p.x, y: p.y, size: p.size, col: [p.col[0], p.col[1], p.col[2], a], mode: p.mode || 1, flat: p.flat };
        if (p.streak) { q.vx = p.vx; q.vy = p.vy; }
        (p.add ? add : norm).push(q);
      }
      if (norm.length) this._quads(view, norm, false);
      if (add.length) this._quads(view, add, true);
    }
    _draw(view, data, mode, additive, prim) {
      const gl = this.gl;
      gl.useProgram(this.pFx); gl.uniformMatrix3fv(this.u.uView.get(this.pFx), false, view); gl.uniform1i(this.u.uMode.get(this.pFx), mode);
      gl.blendFunc(gl.ONE, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(this.fxVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(prim ?? gl.TRIANGLES, 0, data.length / 8); gl.bindVertexArray(null);
    }
    _quads(view, list, additive) {
      const byMode = {};
      for (const q of list) {
        const m = q.mode || 1, arr = (byMode[m] = byMode[m] || []);
        const [r, g, b, a] = q.col, c = [r * a, g * a, b * a, additive ? 0 : a];
        let ux = q.size, uy = 0, vx = 0, vy = q.size * (q.flat || 1);
        if (q.vx !== undefined) {           // stretched spark along velocity
          const sp = Math.hypot(q.vx, q.vy) + 1e-3, L = Math.max(q.size, sp * 0.035);
          ux = q.vx / sp * L; uy = q.vy / sp * L; vx = -q.vy / sp * q.size * 0.35; vy = q.vx / sp * q.size * 0.35;
        }
        const P = (s, t) => [q.x + ux * s + vx * t, q.y + uy * s + vy * t, s, t, ...c];
        arr.push(...P(-1, -1), ...P(1, -1), ...P(1, 1), ...P(-1, -1), ...P(1, 1), ...P(-1, 1));
      }
      for (const m in byMode) this._draw(view, new Float32Array(byMode[m]), +m, additive);
    }
    _trail(view) {
      const T = this.trail, n = T.length, data = [];
      for (let i = 1; i < n; i++) {
        const A = T[i - 1], B = T[i], ka = (1 - (this.time - A.t) / 0.12) * A.k, kb = (1 - (this.time - B.t) / 0.12) * B.k;
        const col = (k, edge) => [1 * k, 0.86 * k, 0.55 * k, 0];
        // two-sided soft ribbon between mid->tip lines of consecutive samples
        const mA = A.a, tA = A.b, mB = B.a, tB = B.b;
        const v = (p, s, t, k) => [p[0], p[1], s, t, ...col(Math.max(0, k))];
        const cA = [(mA[0] + tA[0]) / 2, (mA[1] + tA[1]) / 2], cB = [(mB[0] + tB[0]) / 2, (mB[1] + tB[1]) / 2];
        for (const [p0, q0, p1, q1, t0, t1] of [[mA, cA, mB, cB, -1, 0], [cA, tA, cB, tB, 0, 1]]) {
          data.push(...v(p0, 1, t0, ka), ...v(p1, 1, t0, kb), ...v(q1, 1, t1, kb), ...v(p0, 1, t0, ka), ...v(q1, 1, t1, kb), ...v(q0, 1, t1, ka));
        }
      }
      this._draw(view, new Float32Array(data), 0, true);
    }
    _pillar(view, tip, k) {
      const w = 70 * k, top = tip[1] - 2600;
      const c = [1 * k * 0.55, 0.85 * k * 0.55, 0.5 * k * 0.55, 0];
      const v = (x, y, s, t) => [x, y, s, t, ...c];
      const d = [v(tip[0] - w, top, 1, -1), v(tip[0] + w, top, 1, 1), v(tip[0] + w, tip[1], 1, 1),
        v(tip[0] - w, top, 1, -1), v(tip[0] + w, tip[1], 1, 1), v(tip[0] - w, tip[1], 1, -1)].flat();
      this._draw(view, new Float32Array(d), 0, true);
    }
  }
  Knight2D.EASE = EASE;
  global.Knight2D = Knight2D;
})(scope);

export const Knight2D = scope.Knight2D;
