// Corporate Climb — tap-to-climb a corporate tower, stomping coworkers' heads on
// the way up. Three.js v0.160 ES module.
//
// Single input: TAP to hop up the zig-zagging ladder of desk-ledges. The hero
// lands on the next coworker's head (a comedic stomp) and stands on their desk —
// that rung becomes the new floor. Time the tap to the coworker's nervous bob
// (they "stand up to stretch" — stomp them at the apex) for a PERFECT stomp:
// combo, gold, and a shove that pushes the rising LAYOFF TIDE back down. Mistime
// and you still climb, but the tide of pink-slips creeps up — when it reaches your
// floor, you're LAID OFF. Endless; titles escalate Intern → CEO → and beyond.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { deskSlab, towerFacade, layoffTide, DESK_TONES } from './builders/tower.js?v=1';
import { CHARACTERS } from './builders/characters.js?v=1';

// --- tunables ---------------------------------------------------------------
const RUNG_RISE = 1.72;          // vertical gap between desk ledges
const SIDE = 1.18;               // horizontal offset; rungs alternate -SIDE / +SIDE
const DESK_HALF = 1.04;          // desk slab half-width
const HERO_SCALE = 0.62;
const HOP_TIME = 0.26;           // single hop duration (caps tap rate ~3.8/s)
const HOP_APEX = 0.95;           // extra height at the top of the hop arc

const AHEAD = 7;                 // rungs kept spawned above the hero
const BEHIND = 4;                // recycle rungs more than this below

// rhythm window — a coworker is "stompable for PERFECT" while their nervous bob is
// near apex. Generous so it reads on a phone in a scroll feed.
const WIN_THRESH = 0.42;         // bob value above this = in the perfect window

// layoff tide
const TIDE_START = -9.0;          // tide top starts this far below floor 0 (early grace)
const TIDE_BASE = 0.64;           // rise speed (units/s) at the start
const TIDE_RAMP = 0.028;          // extra rise speed per floor climbed (altitude bites)
const TIDE_ACCEL = 0.013;         // extra rise speed per second elapsed
const TIDE_PUSHBACK = 1.05;       // a PERFECT stomp shoves the tide down this far
const TIDE_GRACE = 1.6;           // no tide rise / no death for the first moments
const DEATH_MARGIN = 0.35;        // tide top within this of hero floor = caught

// difficulty: tempo (bob speed) climbs with height so the rhythm tightens
const TEMPO_BASE = 2.5, TEMPO_MAX = 5.2, TEMPO_OVER = 80;

// camera
const ISO_DIR = new THREE.Vector3(0.4, 0.34, 1).normalize();
const ISO_DIST = 34;
const VIEW = 6.3;                // ortho half-height (shows ~6 rungs)
const CAM_LERP = 6.5;            // follow responsiveness
const CAM_HERO_BELOW = 1.7;      // focus sits this far ABOVE the hero (hero in lower third)

// --- helpers ----------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const smooth = u => u * u * (3 - 2 * u);
const easeOutBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ── job titles by floor (endless; the top tier repeats with a counter feel) ──
const TITLES = [
  [0,   'INTERN'],
  [4,   'ASSOCIATE'],
  [9,   'ANALYST'],
  [15,  'MANAGER'],
  [23,  'SR. MANAGER'],
  [32,  'DIRECTOR'],
  [44,  'VP'],
  [58,  'SVP'],
  [74,  'C-SUITE'],
  [92,  'CEO'],
  [120, 'CHAIRMAN'],
  [150, 'OVERLORD'],
  [200, 'DEMIGOD'],
];
function titleFor(floor){
  let t = TITLES[0][1];
  for (const [f, name] of TITLES) if (floor >= f) t = name; else break;
  return t;
}
// savage one-liner the moment you reach a new title
const TITLE_QUIPS = {
  ASSOCIATE:    'You have opinions now. Nobody asked.',
  ANALYST:      'You make slides about the slides.',
  MANAGER:      'You step on the people who got you here.',
  'SR. MANAGER':'Now you delegate the stepping.',
  DIRECTOR:     'Your calendar has a calendar.',
  VP:           'You speak only in synergy.',
  SVP:          'You haven’t done real work in years.',
  'C-SUITE':    'The air is thin. So is your soul.',
  CEO:          'You did it. Was it worth it?',
  CHAIRMAN:     'You own the ladder now. Still climbing.',
  OVERLORD:     'There is no top. Keep going.',
  DEMIGOD:      'Mortals fear your quarterly outlook.',
};

export function startGame({ canvas, hud }){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141d2b, 34, 58);   // dusk corporate haze

  const camera = new THREE.OrthographicCamera(-VIEW, VIEW, VIEW, -VIEW, 0.1, 200);
  const camFocus = new THREE.Vector3(0, CAM_HERO_BELOW, 0);

  // ── dusk-skyline sky dome: deep navy crown → warm amber haze at the horizon
  //    (golden-hour glass-tower mood; the corporate dream at sunset) ──
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(180, 24, 14),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x101830) },   // deep navy crown
        mid: { value: new THREE.Color(0x2a3358) },   // dusk blue
        bot: { value: new THREE.Color(0x7a5a5e) },   // hazy mauve horizon
        glow: { value: new THREE.Color(0xe8a25a) },  // amber sun-glow corner
        glowDir: { value: new THREE.Vector3(0.5, -0.18, 0.6).normalize() },
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 glow; uniform vec3 glowDir; void main(){ vec3 n = normalize(vP); float h = n.y; vec3 c = h > 0.0 ? mix(mid, top, clamp(h*1.15,0.0,1.0)) : mix(mid, bot, clamp(-h*1.6,0.0,1.0)); float g = clamp(dot(n, glowDir), 0.0, 1.0); c = mix(c, glow, g*g*0.55); gl_FragColor = vec4(c,1.0); }',
    })
  );
  scene.add(sky);

  // ── lighting: cool ambient + warm key (sun) + teal rim, low contrast ──
  scene.add(new THREE.HemisphereLight(0xbcd0ee, 0x2a2230, 0.7));
  const key = new THREE.DirectionalLight(0xffe6c4, 0.85);
  key.position.set(6, 16, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 80;
  key.shadow.camera.left = -14; key.shadow.camera.right = 14;
  key.shadow.camera.top = 16; key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0006;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fd0e0, 0.32);
  rim.position.set(-8, 6, -10);
  scene.add(rim);

  // ── floating office paper motes — drift up, catch the warm light ──
  const MOTES = 90;
  const mGeo = new THREE.BufferGeometry();
  const mPos = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++){
    mPos[i * 3] = (Math.random() * 2 - 1) * 11;
    mPos[i * 3 + 1] = Math.random() * 16 - 4;
    mPos[i * 3 + 2] = (Math.random() * 2 - 1) * 5 + 1;
  }
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({
    color: 0xf3ead4, size: 0.12, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false,
  }));
  scene.add(motes);

  // ── parallax glass facade behind the play column (wraps in Y as we climb) ──
  const facade = towerFacade(16);
  facade.position.set(0, 0, -3.4);
  scene.add(facade);
  const FACADE_TILE = facade.userData.tileH;
  const FACADE_PARALLAX = 0.62;

  // ── the rising layoff tide ──
  const tide = layoffTide(28);
  scene.add(tide);
  const tideTeeth = tide.userData.teeth;
  let tideY = TIDE_START;

  // ── bloom (executive gold + lit windows + tide glow pop) ──
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.6, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    const aspect = w / h;
    camera.left = -VIEW * aspect; camera.right = VIEW * aspect;
    camera.top = VIEW; camera.bottom = -VIEW;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── hero: reuse the convenience-store roster (root → flip → model w/ rig) ──
  const ROSTER = Object.keys(CHARACTERS);
  let charIdx = Math.floor(Math.random() * ROSTER.length);
  function pickChar(){ charIdx = (charIdx + 1) % ROSTER.length; return ROSTER[charIdx]; }

  let hero = null, rig = null, rigBase = null;
  function buildPerson(charKey, scl){
    const model = (CHARACTERS[charKey] || CHARACTERS.businessman)();
    model.scale.setScalar(scl);
    const bb = new THREE.Box3().setFromObject(model);
    const h = bb.max.y - bb.min.y;
    const wrap = new THREE.Group();
    model.position.y = -bb.min.y;            // feet at wrap y=0
    wrap.add(model);
    wrap.userData.rig = model.userData.rig || null;
    wrap.userData.height = h;
    return wrap;
  }
  function buildHeroMesh(charKey){
    const model = (CHARACTERS[charKey] || CHARACTERS.businessman)();
    model.scale.setScalar(HERO_SCALE);
    const bb = new THREE.Box3().setFromObject(model);
    const CENTER = (bb.max.y - bb.min.y) / 2;
    const flip = new THREE.Group();
    flip.position.y = CENTER;
    model.position.y = -bb.min.y - CENTER;   // feet at root y=0, pivot at body centre
    flip.add(model);
    const root = new THREE.Group();
    root.add(flip);
    root.userData.flip = flip;
    root.userData.rig = model.userData.rig || null;
    return root;
  }
  function setHero(charKey){
    if (hero) scene.remove(hero);
    hero = buildHeroMesh(charKey);
    scene.add(hero);
    rig = hero.userData.rig;
    rigBase = rig ? {
      legL: rig.legL.rotation.x, legR: rig.legR.rotation.x,
      armL: rig.armL.rotation.x, armR: rig.armR.rotation.x,
    } : null;
  }
  setHero(ROSTER[charIdx]);

  function restPose(){
    if (!rig || !rigBase) return;
    rig.legL.rotation.set(rigBase.legL, 0, 0); rig.legR.rotation.set(rigBase.legR, 0, 0);
    rig.armL.rotation.set(rigBase.armL, 0, 0); rig.armR.rotation.set(rigBase.armR, 0, 0);
  }
  // hop limb pose: knees tuck up at the arc apex, arms swing up, then open to land
  function poseHop(t){
    if (!rig || !rigBase) return;
    const tuck = Math.sin(Math.PI * clamp(t, 0, 1));
    rig.legL.rotation.x = rigBase.legL - 1.4 * tuck;
    rig.legR.rotation.x = rigBase.legR - 1.4 * tuck;
    rig.armL.rotation.set(rigBase.armL - 1.1 * tuck, 0, -0.25 * tuck);
    rig.armR.rotation.set(rigBase.armR - 1.1 * tuck, 0,  0.25 * tuck);
  }

  // ── particle pool (stomp puff + gold burst + voxel shatter) ──
  const PCOUNT = 130;
  const pGeo = new THREE.BoxGeometry(1, 1, 1);
  const pPool = [];
  for (let i = 0; i < PCOUNT; i++){
    const m = new THREE.Mesh(pGeo, new THREE.MeshStandardMaterial({ flatShading: true, transparent: true }));
    m.visible = false; m.frustumCulled = false; m.castShadow = false; scene.add(m);
    pPool.push({ m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, size: 0.1, grav: 9, soft: false, spin: 0 });
  }
  let pCur = 0;
  function spawnP(x, y, z, color, o){
    const p = pPool[pCur]; pCur = (pCur + 1) % PCOUNT;
    const m = p.m; m.visible = true; m.position.set(x, y, z);
    const s = o.size || 0.12; m.scale.set(s, s, s);
    m.material.color.setHex(color);
    if (o.emissive){ m.material.emissive.setHex(color); m.material.emissiveIntensity = o.emissive; }
    else { m.material.emissive.setHex(0x000000); m.material.emissiveIntensity = 0; }
    m.material.opacity = 1;
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.grav = o.grav != null ? o.grav : 9; p.soft = !!o.soft;
    p.life = p.maxLife = o.life || 0.6; p.size = s; p.spin = o.spin || 0;
  }
  function burst(x, y, z, { count = 12, color = 0xf2c14e, speed = 3, up = 3, size = 0.13, life = 0.6, emissive = 0 } = {}){
    for (let i = 0; i < count; i++){
      const a = Math.random() * Math.PI * 2, r = Math.random();
      spawnP(x, y, z, color, { vx: Math.cos(a) * speed * r, vy: up * (0.5 + Math.random()), vz: Math.sin(a) * speed * r,
        size: size * (0.7 + Math.random() * 0.6), life: life * (0.7 + Math.random() * 0.6), grav: 9, emissive, spin: 6 });
    }
  }
  function puffFx(x, y, z, { count = 5, color = 0xeee7d6, size = 0.18, life = 0.5 } = {}){
    for (let i = 0; i < count; i++)
      spawnP(x, y, z, color, { vx: (Math.random() * 2 - 1) * 1.1, vy: 0.5 + Math.random() * 0.6, vz: (Math.random() * 2 - 1) * 0.7,
        size: size * (0.6 + Math.random() * 0.6), life, grav: 1.0, soft: true });
  }
  function updateParticles(dt){
    for (const p of pPool){
      if (!p.m.visible) continue;
      p.life -= dt;
      if (p.life <= 0){ p.m.visible = false; continue; }
      const m = p.m;
      m.position.x += p.vx * dt; m.position.y += p.vy * dt; m.position.z += p.vz * dt;
      p.vy -= p.grav * dt;
      const t = p.life / p.maxLife;
      if (p.soft){ m.scale.setScalar(p.size * (1.4 - 0.6 * t)); m.material.opacity = t; }
      else { m.scale.setScalar(p.size * Math.max(0.2, t)); m.material.opacity = Math.min(1, t * 1.6); }
      m.rotation.x += p.spin * dt; m.rotation.y += p.spin * dt;
    }
  }
  function shatterHero(){
    hero.updateWorldMatrix(true, true);
    const wp = new THREE.Vector3();
    hero.traverse(o => {
      if (!o.isMesh) return;
      o.getWorldPosition(wp);
      const col = (o.material && o.material.color) ? o.material.color.getHex() : 0xcccccc;
      for (let k = 0; k < 2; k++)
        spawnP(wp.x, wp.y, wp.z, col, { vx: (Math.random() * 2 - 1) * 2.2, vy: 0.6 + Math.random() * 2.2, vz: (Math.random() * 2 - 1) * 2.0,
          size: 0.14, life: 1.1, grav: 9, spin: 7 });
    });
    hero.visible = false;
  }

  // ── slow-mo + camera kick ──
  let slow = 0, slowAmt = 1, timeScale = 1, camKick = 0, shake = 0;
  function doSlow(amt, dur){ if (slow > 0) return; slow = dur; slowAmt = amt; }

  // ── WebAudio kit (lazy unlock on first tap) ──
  let AC = null, master = null;
  function audioUnlock(){
    if (AC){ if (AC.state !== 'running') AC.resume(); return; }
    const ACtor = window.AudioContext || window.webkitAudioContext; if (!ACtor) return;
    AC = new ACtor();
    master = AC.createGain(); master.gain.value = 0.85;
    const comp = AC.createDynamicsCompressor();
    master.connect(comp); comp.connect(AC.destination);
  }
  function tone(freq, dur, o = {}){
    if (!AC) return;
    const t0 = AC.currentTime + (o.delay || 0);
    const osc = AC.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || 3400;
    osc.connect(g); g.connect(lp); lp.connect(master); osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function noiseBurst(dur, o = {}){
    if (!AC) return;
    const t0 = AC.currentTime + (o.delay || 0);
    const n = Math.max(1, Math.floor(AC.sampleRate * dur)); const buf = AC.createBuffer(1, n, AC.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = AC.createBufferSource(); src.buffer = buf;
    const g = AC.createGain(); g.gain.value = o.gain || 0.15;
    const f = AC.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.value = o.hp || 500;
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }
  // comedic "boink" stomp — a squishy low thud + a rubbery pitch drop
  function sfxStomp(){ tone(260, 0.13, { type: 'sine', gain: 0.16, slideTo: 90 }); noiseBurst(0.1, { gain: 0.08, hp: 900, type: 'lowpass' }); }
  function sfxPerfect(combo){ const b = 540 + Math.min(combo, 10) * 34; tone(b, 0.13, { gain: 0.17 }); tone(b * 1.5, 0.2, { gain: 0.12, delay: 0.05 }); tone(b * 2, 0.18, { gain: 0.08, delay: 0.09 }); }
  function sfxPromote(){ tone(523, 0.16, { gain: 0.16 }); tone(659, 0.16, { gain: 0.15, delay: 0.08 }); tone(784, 0.26, { gain: 0.15, delay: 0.16 }); }
  function sfxStumble(){ tone(180, 0.14, { type: 'square', gain: 0.1, slideTo: 120 }); }
  // sad-trombone-ish "laid off"
  function sfxLaidOff(){
    const seq = [[392, 0], [370, 0.17], [349, 0.34], [311, 0.52]];
    for (const [f, d] of seq) tone(f, 0.34, { type: 'sawtooth', gain: 0.14, slideTo: f * 0.94, delay: d, lp: 1400 });
    noiseBurst(0.5, { gain: 0.12, hp: 200 });
  }

  // ── rungs (desk ledges + a coworker standing on each) ──
  let rungs = [];
  let nextIdx = 0;
  function difficultyAt(idx){ return clamp(idx / TEMPO_OVER, 0, 1); }
  function tempoAt(idx){ return lerp(TEMPO_BASE, TEMPO_MAX, difficultyAt(idx)); }

  function disposeGroup(grp){
    grp.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    scene.remove(grp);
  }

  function makeRung(idx){
    const x = (idx % 2 ? 1 : -1) * SIDE;
    const y = idx * RUNG_RISE;
    const tier = clamp(idx / 100, 0, 1);
    const tone = DESK_TONES[idx % DESK_TONES.length];
    const slab = deskSlab(DESK_HALF, tone, idx, tier);
    slab.position.set(x, y, 0);
    scene.add(slab);

    // coworker standing on the desk facing the camera-ish
    const charKey = ROSTER[(idx * 5 + 3) % ROSTER.length];
    const worker = buildPerson(charKey, HERO_SCALE * 0.96);
    worker.position.set(x, y, 0.05);
    worker.rotation.y = (x < 0 ? 0.35 : -0.35);   // slight turn toward play column
    worker.userData.baseY = y;
    scene.add(worker);

    return {
      idx, x, y, half: DESK_HALF, slab, worker,
      rig: worker.userData.rig, wh: worker.userData.height,
      bobPhase: idx * 1.27, stomped: false,
    };
  }

  function spawnNext(){ rungs.push(makeRung(nextIdx++)); }
  function ensureAhead(){ while (rungs[rungs.length - 1].idx < current.idx + AHEAD) spawnNext(); }
  function recycleBehind(){
    while (rungs.length && rungs[0].idx < current.idx - BEHIND){
      const r = rungs.shift();
      disposeGroup(r.slab); disposeGroup(r.worker);
    }
  }
  function rungByIdx(i){ return rungs.find(r => r.idx === i); }

  // bob value of a coworker right now (−1..1); apex (near +1) is the perfect window
  let clock = 0;
  function bobOf(r){ return Math.sin(clock * tempoAt(r.idx) + r.bobPhase); }

  // ── state ──
  const IDLE = 'idle', HOP = 'hop', STUMBLE = 'stumble', DEAD_FALL = 'deadfall', DEAD = 'dead';
  let state = IDLE;
  let current = null;
  let score = 0, combo = 0, best = readBest();
  let curTitle = 'INTERN';
  let hopT = 0, hopFrom = null, hopTo = null, hopPerfect = false;
  let stumbleT = 0;
  let deadTimer = 0;
  let elapsed = 0, graceT = 0;

  // PERFECT window = caught them at the very top of the stand-up (bob near apex)
  const PERFECT_THRESH = 0.74;
  const STUMBLE_LOCK = 0.34;       // brief lockout after a mistimed tap

  const PERFECT_WORDS = ['STOMPED!', 'CRUSHED!', 'FLATTENED!', 'BULLDOZED!', 'STEAMROLLED!'];
  const GOOD_WORDS = ['up!', 'climb!', 'next!', 'hustle!', 'move!'];
  const STUMBLE_WORDS = ['OFF-BEAT', 'MISTIMED', 'TOO SOON', 'WHIFF'];
  let popI = 0;
  const pickWord = (arr) => arr[(popI++) % arr.length];

  function readBest(){ try { return Number(localStorage.getItem('cc.best')) || 0; } catch (e){ return 0; } }
  function writeBest(v){ try { localStorage.setItem('cc.best', String(v)); } catch (e){} }

  function reset(){
    for (const r of rungs){ disposeGroup(r.slab); disposeGroup(r.worker); }
    rungs = []; nextIdx = 0;
    spawnNext();
    current = rungs[0];
    while (rungs[rungs.length - 1].idx < AHEAD) spawnNext();
    score = 0; combo = 0; state = IDLE;
    curTitle = 'INTERN';
    elapsed = 0; graceT = 0;
    hopT = 0; stumbleT = 0;
    tideY = TIDE_START;
    setHero(pickChar());
    // hero stands on rung 0; clear the worker there (you start ON your own desk)
    current.worker.visible = false; current.stomped = true;
    hero.position.set(current.x, current.y, 0.05);
    hero.scale.set(1, 1, 1);
    hero.rotation.set(0, 0, 0);
    hero.userData.flip.rotation.set(0, 0, 0);
    restPose();
    hero.visible = true;
    slow = 0; timeScale = 1; camKick = 0; shake = 0;
    camFocus.set(0, current.y + CAM_HERO_BELOW, 0);
    placeCamera();
    layoutFacade();
    hud.setScore(0); hud.setCombo(0); hud.setTitle('INTERN'); hud.setReady(true); hud.setDead(null);
  }

  function startHop(){
    audioUnlock();
    if (state !== IDLE) return;          // timing game — no tap buffering across hop/stumble
    const target = rungByIdx(current.idx + 1);
    if (!target) return;
    const bob = bobOf(target);
    if (bob <= WIN_THRESH){ stumble(); return; }   // mistimed → stumble, no climb
    hopPerfect = bob >= PERFECT_THRESH;
    hopFrom = { x: current.x, y: current.y };
    hopTo = target;
    hopT = 0;
    state = HOP;
    hero.rotation.y = (target.x > current.x) ? -0.5 : 0.5;   // face the direction of travel
  }

  // mistimed tap: hero flinches in place, loses the combo + a beat, tide keeps rising.
  function stumble(){
    state = STUMBLE;
    stumbleT = 0;
    combo = 0;
    hud.setCombo(0);
    sfxStumble();
    hud.pop(STUMBLE_WORDS[(popI++) % STUMBLE_WORDS.length], 'plain');
  }

  function landHop(){
    const target = hopTo;
    current = target;
    score = current.idx;
    combo += 1;
    stompWorker(target, hopPerfect);
    if (hopPerfect){
      tideY -= TIDE_PUSHBACK;                       // a clean apex-stomp shoves the tide down
      burst(target.x, target.y + 0.3, 0.3, { count: 12 + Math.min(combo, 8), color: 0xf2c14e, speed: 3.2, up: 3.4, size: 0.15, life: 0.7, emissive: 1.2 });
      burst(target.x, target.y + 0.3, 0.3, { count: 6, color: 0x9ff0e6, speed: 2.4, up: 2.8, size: 0.12, life: 0.6, emissive: 1.0 });
      camKick = 0.5; doSlow(0.55, 0.1);
      sfxPerfect(combo);
      hud.pop(combo >= 2 ? pickWord(PERFECT_WORDS) + ' ×' + combo : pickWord(PERFECT_WORDS), 'perfect');
    } else {
      // in-window but not dead-centre — still a climb, lighter celebration
      burst(target.x, target.y + 0.25, 0.3, { count: 6, color: 0xf2c14e, speed: 2.2, up: 2.6, size: 0.12, life: 0.5, emissive: 0.8 });
      puffFx(target.x, target.y + 0.2, 0.3, { count: 5 });
      sfxStomp();
      hud.pop(combo >= 2 ? pickWord(GOOD_WORDS) + ' ×' + combo : pickWord(GOOD_WORDS), 'plain');
    }
    hud.setScore(score);
    hud.setCombo(combo);
    // promotion?
    const t = titleFor(score);
    if (t !== curTitle){
      curTitle = t;
      hud.setTitle(t);
      sfxPromote();
      camKick = Math.max(camKick, 0.65);
      hud.pop(t, 'promote', TITLE_QUIPS[t] || '');
    }
    state = IDLE;
    ensureAhead();
    recycleBehind();
  }

  function stompWorker(r, hard){
    if (r.stomped) return;
    r.stomped = true;
    const w = r.worker;
    // squash flat + drop slightly (the comedic "stepped on" pose) — flatter on a perfect
    w.scale.set(hard ? 1.35 : 1.25, hard ? 0.22 : 0.34, hard ? 1.2 : 1.15);
    w.position.y = r.y - 0.02;
    puffFx(r.x, r.y + 0.15, 0.35, { count: hard ? 9 : 7, color: 0xd9d2c2 });
  }

  function die(){
    state = DEAD_FALL;
    deadTimer = 0;
    combo = 0;
    hud.setCombo(0);
    shatterHero();
    shake = 0.6;
    sfxLaidOff();
    doSlow(0.4, 0.5);
  }

  function finalizeDeath(){
    state = DEAD;
    if (score > best){ best = score; writeBest(best); }
    submitScore(score);
    hud.setDead({ score, best, title: curTitle });
  }

  function restart(){ reset(); }

  // ── camera ──
  function placeCamera(){
    let sx = 0, sy = 0;
    if (shake > 0){ sx = (Math.random() * 2 - 1) * shake * 0.5; sy = (Math.random() * 2 - 1) * shake * 0.5; }
    camera.position.set(
      camFocus.x + ISO_DIR.x * ISO_DIST + sx,
      camFocus.y + ISO_DIR.y * ISO_DIST + sy,
      camFocus.z + ISO_DIR.z * ISO_DIST);
    camera.lookAt(camFocus.x, camFocus.y, camFocus.z);
  }
  function updateCamera(dt){
    if (state !== DEAD_FALL && state !== DEAD){
      const targetY = hero.position.y + CAM_HERO_BELOW + camKick;
      camFocus.y = lerp(camFocus.y, targetY, CAM_LERP * dt);
      camFocus.x = lerp(camFocus.x, 0, CAM_LERP * dt);
    }
    placeCamera();
  }

  function layoutFacade(){ facade.position.y = Math.floor(camFocus.y / FACADE_TILE) * FACADE_TILE - FACADE_TILE; }
  function updateFacade(){
    // keep two tiles of windows always straddling the camera as it climbs
    const base = camFocus.y * FACADE_PARALLAX;
    facade.position.y = Math.floor((base) / FACADE_TILE) * FACADE_TILE;
    facade.position.x = 0;
  }

  // ── main loop ──
  let last = performance.now();
  let idleClock = 0;
  function tick(now){
    requestAnimationFrame(tick);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;

    if (slow > 0){ slow -= dt; timeScale = slow > 0 ? slowAmt : 1; } else timeScale = 1;
    const gdt = dt * timeScale;
    camKick = lerp(camKick, 0, 8 * dt);
    shake = lerp(shake, 0, 6 * dt);
    clock += gdt;

    const playing = (state === IDLE || state === HOP || state === STUMBLE);
    if (playing){
      elapsed += gdt;
      graceT += gdt;
    }

    // backdrop trails the camera
    sky.position.copy(camera.position);
    motes.position.y = camFocus.y - 4;
    const mp = motes.geometry.attributes.position;
    for (let i = 0; i < mp.count; i++){
      let y = mp.getY(i) + dt * 0.5;
      if (y > 18) y = -4;
      mp.setY(i, y);
      mp.setX(i, mp.getX(i) + Math.sin(now / 1000 * 0.3 + i) * dt * 0.1);
    }
    mp.needsUpdate = true;

    // coworkers' nervous typing-bob + perfect-window glow
    for (const r of rungs){
      if (r.stomped) continue;
      const b = bobOf(r);
      r.worker.position.y = r.y + Math.max(0, b) * 0.16;   // bob up only (stand to stretch)
      // arms type when low, lift at apex
      if (r.rig){
        r.rig.armL.rotation.x = -0.3 - 0.5 * Math.max(0, b);
        r.rig.armR.rotation.x = -0.3 - 0.5 * Math.max(0, b);
      }
      // glow the desk accent when in the perfect window (only the NEXT target matters,
      // but glowing all upcoming reads as a rhythm wave — keep it to the next 2)
      const m = r.slab.userData.accentMesh;
      if (m){
        const isTarget = current && (r.idx === current.idx + 1);
        const lit = isTarget && b > WIN_THRESH;
        m.material.emissiveIntensity = lit ? 1.4 : 0;
      }
    }

    // ── tide rise ──
    if (playing && graceT > TIDE_GRACE){
      const speed = TIDE_BASE + score * TIDE_RAMP + elapsed * TIDE_ACCEL;
      tideY += speed * gdt;
    }
    // tide never overtakes instantly far above — but keep it honest
    tide.position.y = tideY;
    // jitter the shredded teeth
    for (let i = 0; i < tideTeeth.length; i++){
      tideTeeth[i].position.y = 0.12 + Math.sin(clock * 7 + i * 1.3) * 0.16 + Math.sin(clock * 13 + i) * 0.06;
    }
    // death check: tide reaches the hero's current floor
    if (playing && graceT > TIDE_GRACE && tideY >= hero.position.y - DEATH_MARGIN){
      die();
    }

    if (state === HOP){
      hopT += gdt;
      const t = clamp(hopT / HOP_TIME, 0, 1);
      hero.position.x = lerp(hopFrom.x, hopTo.x, t);
      hero.position.y = lerp(hopFrom.y, hopTo.y, t) + 4 * HOP_APEX * t * (1 - t);
      // squash/stretch
      const stretch = 1 + 0.22 * Math.sin(Math.PI * t) * (1 - 0.4 * t);
      hero.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      poseHop(t);
      if (t >= 1){
        hero.position.set(hopTo.x, hopTo.y, 0.05);
        hero.scale.set(1, 1, 1);
        restPose();
        landHop();
      }
    } else if (state === IDLE){
      // anxious idle: small nervous bob + arm fidget
      idleClock += gdt;
      const air = Math.abs(Math.sin(idleClock * 3.4));
      hero.position.y = current.y + 0.05 * air;
      hero.scale.set(1, 1 + 0.04 * air, 1);
      if (rig && rigBase){
        rig.armL.rotation.x = rigBase.armL - 0.12 * air;
        rig.armR.rotation.x = rigBase.armR - 0.12 * air;
      }
    } else if (state === STUMBLE){
      // brief flinch-in-place, then control returns
      stumbleT += gdt;
      const w = Math.sin(stumbleT / STUMBLE_LOCK * Math.PI);
      hero.position.x = current.x + Math.sin(stumbleT * 40) * 0.05 * (1 - stumbleT / STUMBLE_LOCK);
      hero.position.y = current.y + 0.04 * w;
      hero.rotation.z = Math.sin(stumbleT * 30) * 0.08 * (1 - stumbleT / STUMBLE_LOCK);
      if (stumbleT >= STUMBLE_LOCK){ hero.position.x = current.x; hero.rotation.z = 0; restPose(); state = IDLE; }
    } else if (state === DEAD_FALL){
      deadTimer += dt;
      if (deadTimer > 0.9) finalizeDeath();
    }

    updateParticles(gdt);
    updateCamera(gdt);
    updateFacade();
    composer.render();
  }

  reset();
  requestAnimationFrame(tick);

  function submitScore(s){
    try {
      const A = window.Aigram;
      if (!A || !A.canRank) return;
      A.callAigramAPI('/note/aigram/ai/game/rank/score/save', 'POST', {
        session_id: A.gameUuid, score: Math.round(s),
      }).catch(() => {});
    } catch (e){}
  }

  // test hooks
  window.__cc = {
    get state(){ return state; },
    get score(){ return score; },
    get combo(){ return combo; },
    get tideY(){ return tideY; },
    get heroY(){ return hero.position.y; },
    get title(){ return curTitle; },
    rungs: () => rungs,
    tap(){ startHop(); },
    forcePerfect(v){ if (rungByIdx(current.idx + 1)){ /* test: align bob */ } return v; },
  };

  return { startHop, restart };
}
