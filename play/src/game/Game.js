// Meya Arena — Game.js (v1.1: 4 heroes, skins, ranked, music hooks)
// Third-person ability combat + BR zone + bot AI. Tuning lives in heroes.js.
// PHASE 2: inputs route to the authoritative server; AbilityResolver re-validates
// every cast. Client prediction + reconciliation plug in at castSkill/tryAttack.

import * as THREE from 'three';
import { MAP_RADIUS } from '../core/constants.js';
import { HEROES, BOT_NAMES, BOT_HEROES, BOND, SKINS } from './heroes.js';
import { social } from '../social/Social.js';

// ---------- shared geometry (built once, reused by every character) ----------
const GEO = {
  ring: new THREE.RingGeometry(0.72, 0.98, 32),
  leg: new THREE.CylinderGeometry(0.13, 0.16, 0.72, 8),
  body: new THREE.CapsuleGeometry(0.42, 0.62, 4, 10),
  pad: new THREE.SphereGeometry(0.21, 10, 8),
  arm: new THREE.CylinderGeometry(0.1, 0.12, 0.62, 8),
  head: new THREE.SphereGeometry(0.34, 12, 10),
  visor: new THREE.BoxGeometry(0.42, 0.13, 0.12),
  gun: new THREE.BoxGeometry(0.17, 0.17, 0.95),
  tip: new THREE.SphereGeometry(0.13, 8, 6),
  blade: new THREE.BoxGeometry(0.11, 0.85, 0.2),
  guard: new THREE.BoxGeometry(0.32, 0.08, 0.24),
  proj: new THREE.SphereGeometry(0.2, 10, 8),
  bigProj: new THREE.SphereGeometry(0.42, 12, 10),
  particle: new THREE.SphereGeometry(0.13, 6, 5),
  ringFX: new THREE.RingGeometry(0.82, 1.0, 48),
};
const _matCache = new Map();
function stdMat(color) {
  let m = _matCache.get('s' + color);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, flatShading: true }); _matCache.set('s' + color, m); }
  return m;
}
function glowMat(color) {
  let m = _matCache.get('g' + color);
  if (!m) { m = new THREE.MeshBasicMaterial({ color }); _matCache.set('g' + color, m); }
  return m;
}
const PROJ_COLORS = { mary: 0xf9a8d4, ember: 0xfdba74, george: 0x7dd3fc, kaito: 0xc4b5fd };

function paintLabel(canvas, name, frac, ally) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 256, 64);
  c.font = '900 25px system-ui,sans-serif';
  c.textAlign = 'center';
  c.fillStyle = 'rgba(0,0,0,.65)'; c.fillText(name, 129, 27);
  c.fillStyle = '#fff'; c.fillText(name, 128, 26);
  c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(18, 36, 220, 16);
  c.fillStyle = ally ? '#4ade80' : (frac > 0.5 ? '#4ade80' : frac > 0.25 ? '#fbbf24' : '#ef4444');
  c.fillRect(20, 38, 216 * Math.max(0, frac), 12);
}

function buildHeroMesh(def, name, ally, palette) {
  const g = new THREE.Group();
  const col = palette ? palette.color : def.color;
  const acc = palette ? palette.accent : def.accent;
  const vis = palette ? palette.visor : def.visor;
  const mBody = stdMat(col), mAccent = stdMat(acc),
        mDark = stdMat(0x1e293b), mSkin = stdMat(def.skin);

  const ring = new THREE.Mesh(GEO.ring, new THREE.MeshBasicMaterial({
    color: ally ? 0x34d399 : 0xf87171, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07; g.add(ring);

  const legL = new THREE.Mesh(GEO.leg, mDark); legL.position.set(-0.22, 0.42, 0);
  const legR = new THREE.Mesh(GEO.leg, mDark); legR.position.set(0.22, 0.42, 0);
  const body = new THREE.Mesh(GEO.body, mBody); body.position.y = 1.18;
  const padL = new THREE.Mesh(GEO.pad, mAccent); padL.position.set(-0.52, 1.52, 0);
  const padR = new THREE.Mesh(GEO.pad, mAccent); padR.position.set(0.52, 1.52, 0);
  const armL = new THREE.Mesh(GEO.arm, mBody); armL.position.set(-0.52, 1.1, 0);
  const armR = new THREE.Mesh(GEO.arm, mBody); armR.position.set(0.52, 1.1, 0);
  const head = new THREE.Mesh(GEO.head, mSkin); head.position.y = 2.0;
  const visor = new THREE.Mesh(GEO.visor, glowMat(vis)); visor.position.set(0, 2.02, 0.3);
  g.add(legL, legR, body, padL, padR, armL, armR, head, visor);

  const weapon = new THREE.Group();
  if (def.ranged) {
    const gun = new THREE.Mesh(GEO.gun, mDark); gun.position.z = 0.3;
    const tip = new THREE.Mesh(GEO.tip, glowMat(vis)); tip.position.z = 0.8;
    weapon.add(gun, tip);
    weapon.position.set(0.55, 1.25, 0.35);
  } else {
    const blade = new THREE.Mesh(GEO.blade, mAccent); blade.position.y = -0.5;
    const guard = new THREE.Mesh(GEO.guard, mDark); guard.position.y = -0.05;
    weapon.add(blade, guard);
    weapon.position.set(0.55, 1.35, 0.15);
  }
  g.add(weapon);

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256; labelCanvas.height = 64;
  paintLabel(labelCanvas, name, 1, ally);
  const tex = new THREE.CanvasTexture(labelCanvas);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  label.scale.set(4.6, 1.15, 1); label.position.y = 2.95;
  g.add(label);

  g.traverse((o) => { if (o.isMesh && o !== ring) o.castShadow = true; });
  g.userData = { legL, legR, armL, armR, body, head, weapon, ring, label, labelCanvas, tex,
    weaponHome: weapon.position.clone() };
  return g;
}

// ============================== CHARACTER ==============================
class Character {
  constructor(game, o) {
    this.game = game;
    this.def = HEROES[o.heroId];
    this.heroId = o.heroId;
    this.name = o.name;
    this.team = o.team;
    this.isPlayer = !!o.isPlayer;
    this.maxHp = this.def.hp;
    this.hp = this.maxHp;
    this.shield = 0; this.shieldT = 0;
    this.alive = true;
    this.cds = { s1: 0, s2: 0, ult: 0, bond: 0 };
    this.atkT = 0;
    this.stunT = 0; this.speedBuffT = 0;
    this.kb = new THREE.Vector3();
    this.dashT = 0; this.dashDir = new THREE.Vector3(); this.dashHit = new Set();
    this.ultLeapT = 0; this.ultFrom = new THREE.Vector3(); this.ultTo = new THREE.Vector3();
    this.empowerT = 0;
    this.walk = Math.random() * 5; this.atkAnim = 0;
    this.lastHurt = -99; this.kills = 0; this.dmg = 0;
    this.deadT = 0; this.moving = false;
    this.swiftT = 0;
    this.ai = { wp: o.pos.clone(), think: Math.random() * 0.4, strafe: Math.random() < 0.5 ? 1 : -1,
      stuck: 0, lastPos: o.pos.clone(), target: null };
    this.group = buildHeroMesh(this.def, o.name, o.team === 0, o.palette || null);
    this.group.position.copy(o.pos);
    this.group.rotation.y = Math.atan2(-o.pos.x, -o.pos.z);
    game.engine.scene.add(this.group);
  }
  get pos() { return this.group.position; }

  speed() {
    let s = this.def.speed;
    if (this.speedBuffT > 0) s *= 1.3;
    if (this.swiftT > 0) s *= 1.1;
    return s;
  }

  faceDir(x, z) {
    const want = Math.atan2(x, z);
    let d = want - this.group.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.group.rotation.y += d * 0.25;
  }
  facing() { return { x: Math.sin(this.group.rotation.y), z: Math.cos(this.group.rotation.y) }; }

  moveDir(x, z, dt) {
    if (!this.alive || this.stunT > 0 || this.ultLeapT > 0) return;
    const s = this.speed();
    this.pos.x += x * s * dt;
    this.pos.z += z * s * dt;
    this.faceDir(x, z);
    this.walk += dt * s * 1.7;
    this.moving = true;
  }

  update(dt) {
    const g = this.game;
    if (!this.alive) {
      if (this.deadT > 0 && this.deadT < 1.4) {
        this.deadT += dt;
        this.group.rotation.x = -Math.min(1, this.deadT * 2.5) * Math.PI / 2.2;
        if (this.deadT >= 1.4) this.group.visible = false;
      }
      return;
    }
    this.moving = false;
    for (const k of ['s1', 's2', 'ult', 'bond']) this.cds[k] = Math.max(0, this.cds[k] - dt);
    this.atkT = Math.max(0, this.atkT - dt);
    this.stunT = Math.max(0, this.stunT - dt);
    this.speedBuffT = Math.max(0, this.speedBuffT - dt);
    this.empowerT = Math.max(0, this.empowerT - dt);
    this.swiftT = Math.max(0, this.swiftT - dt);
    if (this.shieldT > 0) { this.shieldT -= dt; if (this.shieldT <= 0) this.shield = 0; }

    if (g.time - this.lastHurt > 5 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.def.regen * dt);
      this.refreshLabel();
    }
    this.pos.addScaledVector(this.kb, dt);
    this.kb.multiplyScalar(Math.pow(0.002, dt));
    if (this.kb.lengthSq() < 0.01) this.kb.set(0, 0, 0);

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.pos.addScaledVector(this.dashDir, 26 * dt);
      this.faceDir(this.dashDir.x, this.dashDir.z);
      g.dashDamage(this);
      const trailCol = this.heroId === 'ember' ? 0xfb923c : 0x22d3ee;
      if (Math.random() < 0.6) g.burst(this.pos, trailCol, 1, 2, 0.3);
    }
    if (this.ultLeapT > 0) {
      this.ultLeapT -= dt;
      const t = 1 - Math.max(0, this.ultLeapT) / 0.38;
      this.pos.lerpVectors(this.ultFrom, this.ultTo, t);
      this.pos.y = Math.sin(t * Math.PI) * 6;
      if (this.ultLeapT <= 0) { this.pos.y = 0; g.titanSlam(this); }
    }

    const u = this.group.userData;
    const sw = this.moving ? Math.sin(this.walk * 2.2) * 0.55 : 0;
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
    u.armL.rotation.x = -sw * 0.7; u.armR.rotation.x = sw * 0.7;
    u.body.position.y = 1.18 + (this.moving ? Math.abs(Math.sin(this.walk * 2.2)) * 0.07 : Math.sin(g.time * 2 + this.walk) * 0.02);
    if (this.atkAnim > 0) {
      this.atkAnim -= dt * 4;
      u.weapon.position.z = u.weaponHome.z + Math.max(0, this.atkAnim) * 0.9;
    }
    if (this.isPlayer) u.ring.material.opacity = 0.7 + Math.sin(g.time * 5) * 0.25;
  }

  refreshLabel() {
    const u = this.group.userData;
    paintLabel(u.labelCanvas, this.name, this.hp / this.maxHp, this.team === 0);
    u.tex.needsUpdate = true;
  }

  takeDamage(amount, source) {
    const g = this.game;
    if (!this.alive || g.state !== 'playing' || amount <= 0) return;
    if (this.heroId === 'george' && this.hp < this.maxHp * 0.5) amount *= 0.85; // Bulwark
    if (source && source.heroId === 'ember' && this.hp < this.maxHp * 0.5) amount *= 1.12; // Ignite
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed; amount -= absorbed;
    }
    this.hp -= amount;
    this.lastHurt = g.time;
    this.refreshLabel();
    g.burst(this.pos, 0xff5040, 4, 5, 0.35);
    if (source && source !== this) {
      source.dmg += amount;
      if (source.isPlayer) { g.hud.spawnDmg(this.pos, amount, 'player'); g.sfx.hit(); }
    }
    if (this.isPlayer) {
      g.hud.damageFlash(); g.engine.shake(0.18); g.sfx.hurt();
      g.hud.spawnDmg(this.pos, amount, 'enemy');
    } else if (g.distToPlayer(this.pos) < 26) g.sfx.hit();
    if (this.hp <= 0) { this.hp = 0; this.die(source); }
  }

  heal(amount) {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.refreshLabel();
    this.game.hud.spawnDmg(this.pos, amount, 'heal');
    this.game.burst(this.pos, 0x4ade80, 10, 4, 0.6);
  }

  die(source) {
    this.alive = false; this.deadT = 0.001;
    this.group.userData.ring.visible = false;
    this.game.onKill(source, this);
  }

  dispose(scene) {
    const u = this.group.userData;
    u.tex.dispose(); u.label.material.dispose(); u.ring.material.dispose();
    scene.remove(this.group);
  }
}

// ============================== GAME ==============================
export class Game {
  constructor(engine, input, hud, sfx, music) {
    this.engine = engine; this.input = input; this.hud = hud; this.sfx = sfx; this.music = music;
    this.state = 'idle';
    this.chars = [];
    this.player = null; this.ally = null;
    this.mode = 'solo'; this.ranked = false;
    this.time = 0;
    this.camYaw = 0; this.camPitch = 0.32;
    this.particleMul = 0.7;
    this.timers = [];
    this.killStreak = [];
    this.bondToastShown = false;
    this.overT = 0; this.spectateTarget = null;
    this.colliders = [];
    this.projectiles = [];
    this.particles = [];
    this.rings = [];
    this.countT = 0;
    this.firstBlood = false;
    this.lastResult = null;

    input.bindAction('attack', () => this.tryAttack());
    input.bindAction('s1', () => this.trySkill('s1'));
    input.bindAction('s2', () => this.trySkill('s2'));
    input.bindAction('ult', () => this.trySkill('ult'));
    input.bindAction('bond', () => this.tryBond());

    this._buildArena();
  }

  playerDef() { return this.player ? this.player.def : HEROES.george; }

  // ---------------- Arena (stylized twilight, zero external assets) ----------------
  _buildArena() {
    const scene = this.engine.scene;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(MAP_RADIUS + 26, 56),
      new THREE.MeshStandardMaterial({ color: 0x151d38, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);

    const gridMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.14, side: THREE.DoubleSide });
    for (const r of [20, 40, 60]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.25, r + 0.25, 72), gridMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
      scene.add(ring);
    }
    const heart = new THREE.Mesh(new THREE.CircleGeometry(4, 32),
      new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.22 }));
    heart.rotation.x = -Math.PI / 2; heart.position.y = 0.03; scene.add(heart);

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(MAP_RADIUS + 2, MAP_RADIUS + 2, 7, 64, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.13, side: THREE.DoubleSide }));
    wall.position.y = 3.5; scene.add(wall);
    const wallTop = new THREE.Mesh(new THREE.TorusGeometry(MAP_RADIUS + 2, 0.25, 8, 72),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 }));
    wallTop.rotation.x = Math.PI / 2; wallTop.position.y = 7; scene.add(wallTop);

    const spots = [];
    let guard = 0;
    while (spots.length < 30 && guard++ < 600) {
      const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 42;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (spots.every((s) => Math.hypot(s.x - x, s.z - z) > 9)) spots.push({ x, z });
    }
    const trunkM = stdMat(0x4a3428), leafM = stdMat(0x16a34a),
          leafM2 = stdMat(0x0d9488), rockM = stdMat(0x475569);
    const trunkG = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    const coneG = new THREE.ConeGeometry(1.9, 3.6, 8);
    const rockG = new THREE.DodecahedronGeometry(1.4, 0);
    const crysG = new THREE.OctahedronGeometry(1.2, 0);
    spots.forEach((s, i) => {
      const kind = i % 3;
      if (kind === 0) {
        const t = new THREE.Mesh(trunkG, trunkM); t.position.set(s.x, 1.2, s.z);
        const c1 = new THREE.Mesh(coneG, i % 2 ? leafM : leafM2); c1.position.set(s.x, 3.9, s.z);
        t.castShadow = c1.castShadow = true; scene.add(t, c1);
        this.colliders.push({ x: s.x, z: s.z, r: 1.1 });
      } else if (kind === 1) {
        const m = new THREE.Mesh(rockG, rockM);
        m.position.set(s.x, 0.9, s.z); m.rotation.set(i, i * 2, 0);
        m.castShadow = true; scene.add(m);
        this.colliders.push({ x: s.x, z: s.z, r: 1.6 });
      } else {
        const m = new THREE.Mesh(crysG, glowMat(i % 2 ? 0xec4899 : 0x22d3ee));
        m.position.set(s.x, 1.3, s.z); m.rotation.y = i;
        scene.add(m);
        this.colliders.push({ x: s.x, z: s.z, r: 1.3 });
      }
    });

    const n = 350, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.45 + 0.08, r = 220;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85 })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfef3c7 }));
    moon.position.set(-120, 110, -140); scene.add(moon);

    this.zoneMesh = new THREE.Mesh(GEO.ringFX, new THREE.MeshBasicMaterial({
      color: 0xef4444, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    this.zoneMesh.rotation.x = -Math.PI / 2; this.zoneMesh.position.y = 0.12;
    scene.add(this.zoneMesh);
  }

  // ---------------- Match lifecycle ----------------
  startMatch({ heroId, mode, playerName, ranked }) {
    for (const c of this.chars) c.dispose(this.engine.scene);
    this.chars = []; this.timers = [];
    for (const p of this.projectiles) p.active = false;
    for (const p of this.particles) { p.life = 0; p.m.visible = false; }
    for (const r of this.rings) { r.t = 99; r.m.visible = false; }

    this.mode = mode; this.ranked = !!ranked;
    this.time = 0; this.state = 'playing';
    this.killStreak = []; this.bondToastShown = false; this.firstBlood = false;
    this.overT = 0; this.spectateTarget = null; this.countT = 3.2;
    this.camPitch = 0.32;
    this.hud.setSpectate(null);
    this.music.start('battle');

    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const spots = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
      spots.push(new THREE.Vector3(Math.cos(a) * 46, 0, Math.sin(a) * 46));
    }
    const palette = social.getEquippedPalette(heroId, SKINS);
    this.player = new Character(this, { heroId, name: playerName, team: 0, isPlayer: true, pos: spots[0], palette });
    this.chars.push(this.player);
    this.camYaw = Math.atan2(this.player.pos.x, this.player.pos.z);
    let teamId = 2;
    if (mode === 'duo') {
      this.ally = new Character(this, { heroId: heroId === 'mary' ? 'george' : 'mary',
        name: heroId === 'mary' ? 'George' : 'Mary', team: 0, pos: spots[1].clone() });
      this.chars.push(this.ally);
    } else this.ally = null;
    const botCount = mode === 'duo' ? 8 : 9;
    for (let i = 0; i < botCount; i++) {
      const id = BOT_HEROES[Math.floor(Math.random() * BOT_HEROES.length)];
      this.chars.push(new Character(this, { heroId: id, name: names[i % names.length],
        team: teamId++, pos: spots[mode === 'duo' ? i + 2 : i + 1].clone() }));
    }
    this.zone = { cx: 0, cz: 0, r: MAP_RADIUS + 2, phase: 0, mode: 'wait', t: 16,
      fromR: MAP_RADIUS + 2, toR: MAP_RADIUS + 2, fromX: 0, fromZ: 0, toX: 0, toZ: 0, dps: 0 };
    this.zonePhases = [
      { wait: 16, shrink: 24, scale: 0.62, dps: 6 },
      { wait: 13, shrink: 20, scale: 0.58, dps: 12 },
      { wait: 11, shrink: 16, scale: 0.55, dps: 22 },
      { wait: 9,  shrink: 14, scale: 0.5,  dps: 34 },
    ];
    this.zoneTickT = 0;
    this.engine.updateCamera(this.player.pos, this.camYaw, this.camPitch, 1, true);
    this.hud.killfeed(`${ranked ? '🏆 RANKED' : '⚔️'} <b>${playerName}</b> entered the arena!`);
    this.hud.toast(ranked ? '🏆 RANKED — good luck!' : (mode === 'duo' ? '💞 Protect each other!' : '⚔️ Last one standing wins!'));
  }

  aliveCount() { let n = 0; for (const c of this.chars) if (c.alive) n++; return n; }
  aliveTeams() { const s = new Set(); for (const c of this.chars) if (c.alive) s.add(c.team); return s; }

  distToPlayer(p) { return this.player && this.player.alive ? Math.hypot(p.x - this.player.pos.x, p.z - this.player.pos.z) : 999; }

  update(dt) {
    this.time += dt;
    if (this.countT > 0) {
      this.countT -= dt;
      const n = Math.ceil(this.countT);
      this.hud.countdown(this.countT <= 0 ? '' : (n > 3 ? '' : String(n)));
      if (this.countT <= 0) { this.hud.toast('FIGHT! ⚔️'); this.sfx.countGo(); }
    }
    const look = this.input.consumeLook();
    this.camYaw += look.dx;
    this.camPitch = Math.min(0.95, Math.max(-0.12, this.camPitch + look.dy));

    const p = this.player;
    if (p.alive) {
      const mv = this.input.getMove();
      if (mv.x !== 0 || mv.y !== 0) {
        const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
        const rx = Math.cos(this.camYaw), rz = -Math.sin(this.camYaw);
        p.moveDir(rx * mv.x + fx * mv.y, rz * mv.x + fz * mv.y, dt);
      }
    }
    for (const c of this.chars) {
      if (!c.isPlayer && c.alive) this.updateBot(c, dt);
    }
    for (const c of this.chars) c.update(dt);
    this._collide(dt);
    this._updateProjectiles(dt);
    this._updateParticles(dt);
    this._updateRings(dt);
    this._updateTimers(dt);
    this._updateZone(dt);
    if (!this.bondToastShown && this.mode === 'duo') {
      const b = this.bondStatus();
      if (b.ready) { this.bondToastShown = true; this.hud.toast('💞 HEARTLINK READY! Press T!'); this.sfx.ready(); }
    }
    let target = p.pos;
    if (!p.alive && this.ally && this.ally.alive) {
      if (this.spectateTarget !== this.ally) { this.spectateTarget = this.ally; this.hud.setSpectate(this.ally.name); }
      target = this.ally.pos;
    }
    this.engine.updateCamera(target, this.camYaw, this.camPitch, dt);
  }

  updateOver(dt) {
    this.overT += dt;
    for (const c of this.chars) c.update(dt);
    this._updateParticles(dt); this._updateRings(dt);
    this.camYaw += dt * 0.4;
    const t = (this.player && this.player.alive ? this.player.pos : (this.spectateTarget ? this.spectateTarget.pos : new THREE.Vector3()));
    this.engine.updateCamera(t, this.camYaw, Math.min(0.9, this.camPitch + dt * 0.3), dt);
  }

  _collide(dt) {
    for (const c of this.chars) {
      if (!c.alive) continue;
      const d = Math.hypot(c.pos.x, c.pos.z);
      const max = MAP_RADIUS + 1;
      if (d > max) { c.pos.x *= max / d; c.pos.z *= max / d; }
      for (const o of this.colliders) {
        const dx = c.pos.x - o.x, dz = c.pos.z - o.z;
        const dd = Math.hypot(dx, dz), min = o.r + 0.7;
        if (dd < min && dd > 0.001) {
          c.pos.x = o.x + dx / dd * min;
          c.pos.z = o.z + dz / dd * min;
        }
      }
    }
    const cs = this.chars;
    for (let i = 0; i < cs.length; i++) {
      if (!cs[i].alive) continue;
      for (let j = i + 1; j < cs.length; j++) {
        if (!cs[j].alive) continue;
        const dx = cs[j].pos.x - cs[i].pos.x, dz = cs[j].pos.z - cs[i].pos.z;
        const dd = Math.hypot(dx, dz);
        if (dd < 1.3 && dd > 0.001) {
          const push = (1.3 - dd) * 0.5;
          const nx = dx / dd, nz = dz / dd;
          cs[i].pos.x -= nx * push; cs[i].pos.z -= nz * push;
          cs[j].pos.x += nx * push; cs[j].pos.z += nz * push;
        }
      }
    }
  }

  // ---------------- Bot AI ----------------
  updateBot(c, dt) {
    const ai = c.ai;
    ai.think -= dt;
    ai.stuck += dt;
    if (ai.stuck > 1.4) {
      ai.stuck = 0;
      if (c.pos.distanceTo(ai.lastPos) < 1.2) {
        ai.wp.set((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
        ai.strafe *= -1;
      }
      ai.lastPos.copy(c.pos);
    }
    if (ai.think > 0) { this._botSteer(c, dt); return; }
    ai.think = 0.35;
    if (Math.random() < 0.2) ai.strafe *= -1;

    const z = this.zone;
    const zd = Math.hypot(c.pos.x - z.cx, c.pos.z - z.cz);
    if (c.team === 0 && this.player.alive) {
      const pd = c.pos.distanceTo(this.player.pos);
      if (pd > 12) ai.wp.copy(this.player.pos);
    } else if (zd > z.r * 0.92) {
      ai.wp.set(z.cx + (Math.random() - 0.5) * z.r, 0, z.cz + (Math.random() - 0.5) * z.r);
    }
    let best = null, bd = 1e9;
    for (const e of this.chars) {
      if (!e.alive || e.team === c.team) continue;
      const d = c.pos.distanceTo(e.pos);
      if (d < bd) { bd = d; best = e; }
    }
    ai.target = (best && bd < 24) ? best : null;
    ai.tDist = bd;

    if (ai.target) {
      const t = ai.target;
      c.faceDir(t.pos.x - c.pos.x, t.pos.z - c.pos.z);
      if (c.atkT <= 0 && bd <= c.def.atkRange + 0.6) this._botAttack(c, t);
      const roll = Math.random();
      if (c.heroId === 'george') {
        if (c.cds.s1 <= 0 && bd < 6.5 && roll < 0.5) this.castSkill(c, 's1');
        else if (c.cds.s2 <= 0 && bd > 5 && bd < 14 && roll < 0.4) this.castSkill(c, 's2');
        else if (c.cds.ult <= 0 && bd < 15 && (t.hp < t.maxHp * 0.5 || roll < 0.15)) this.castSkill(c, 'ult');
      } else if (c.heroId === 'mary') {
        if (c.cds.s1 <= 0 && bd < 18 && roll < 0.5) this.castSkill(c, 's1');
        else if (c.cds.s2 <= 0 && ((bd < 5 && roll < 0.7) || (bd > 14 && roll < 0.3))) this.castSkill(c, 's2');
        else if (c.cds.ult <= 0 && bd < 22 && (t.hp < t.maxHp * 0.55 || roll < 0.12)) this.castSkill(c, 'ult');
      } else if (c.heroId === 'kaito') {
        if (c.cds.s1 <= 0 && bd < 4.5 && roll < 0.6) this.castSkill(c, 's1');
        else if (c.cds.s2 <= 0 && ((bd < 4 && roll < 0.5) || (bd > 6 && bd < 15 && roll < 0.45))) this.castSkill(c, 's2');
        else if (c.cds.ult <= 0 && bd < 18 && (t.hp < t.maxHp * 0.6 || roll < 0.12)) this.castSkill(c, 'ult');
      } else if (c.heroId === 'ember') {
        if (c.cds.s1 <= 0 && bd < 17 && roll < 0.5) this.castSkill(c, 's1');
        else if (c.cds.s2 <= 0 && ((bd < 5 && roll < 0.5) || (bd > 8 && bd < 15 && roll < 0.35))) this.castSkill(c, 's2');
        else if (c.cds.ult <= 0 && bd < 22 && (t.hp < t.maxHp * 0.55 || roll < 0.12)) this.castSkill(c, 'ult');
      }
      const want = c.def.ranged ? 9.5 : 2.2;
      const dx = (c.pos.x - t.pos.x) / (bd || 1), dz = (c.pos.z - t.pos.z) / (bd || 1);
      if (bd < want - 1.5) ai.wp.set(c.pos.x + dx * 6 + -dz * ai.strafe * 3, 0, c.pos.z + dz * 6 + dx * ai.strafe * 3);
      else if (bd > want + 2.5) ai.wp.copy(t.pos);
      else ai.wp.set(c.pos.x + -dz * ai.strafe * 6, 0, c.pos.z + dx * ai.strafe * 6);
    } else if (c.pos.distanceTo(ai.wp) < 3 || (c.team !== 0 && zd > z.r * 0.9)) {
      const rr = Math.max(8, z.r * 0.7);
      const a = Math.random() * Math.PI * 2, r = Math.random() * rr;
      ai.wp.set(z.cx + Math.cos(a) * r, 0, z.cz + Math.sin(a) * r);
    }
    this._botSteer(c, dt);
  }

  _botSteer(c, dt) {
    if (c.stunT > 0 || c.dashT > 0 || c.ultLeapT > 0) return;
    const ai = c.ai;
    const dx = ai.wp.x - c.pos.x, dz = ai.wp.z - c.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.2) return;
    if (ai.target && ai.tDist < c.def.atkRange + 4) {
      c.moveDir(dx / d, dz / d, dt);
      c.faceDir(ai.target.pos.x - c.pos.x, ai.target.pos.z - c.pos.z);
    } else c.moveDir(dx / d, dz / d, dt);
  }

  _botAttack(c, t) {
    c.atkT = c.def.atkInterval * 1.15;
    c.atkAnim = 1;
    const dmgMul = 0.85;
    if (c.def.ranged) {
      const dir = new THREE.Vector3(t.pos.x - c.pos.x, 0, t.pos.z - c.pos.z).normalize();
      this.spawnProjectile({ from: c.pos, dir, speed: 24, dmg: c.def.atkDmg * dmgMul,
        team: c.team, owner: c, color: PROJ_COLORS[c.heroId] || 0x7dd3fc, life: 0.9 });
      if (this.distToPlayer(c.pos) < 30) this.sfx.shoot();
    } else {
      if (this.distToPlayer(c.pos) < 30) this.sfx.melee();
      this.meleeHit(c, c.def.atkRange + 0.6, c.def.atkDmg * dmgMul);
    }
  }

  // ---------------- Player actions ----------------
  _camForward() { return { x: -Math.sin(this.camYaw), z: -Math.cos(this.camYaw) }; }

  autoTarget(c, range) {
    const dir = c.isPlayer ? this._camForward() : c.facing();
    let best = null, bestScore = 1e9, fallback = null, fd = range * 0.75;
    for (const e of this.chars) {
      if (!e.alive || e.team === c.team) continue;
      const dx = e.pos.x - c.pos.x, dz = e.pos.z - c.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > range) continue;
      const ang = Math.acos(Math.min(1, Math.max(-1, (dx * dir.x + dz * dir.z) / (d || 1))));
      if (ang < 1.25 && d + ang * 9 < bestScore) { bestScore = d + ang * 9; best = e; }
      if (d < fd) { fd = d; fallback = e; }
    }
    return best || fallback;
  }

  tryAttack() {
    const p = this.player;
    if (this.state !== 'playing' || !p || !p.alive || p.stunT > 0 || p.ultLeapT > 0) return;
    if (p.atkT > 0) return;
    p.atkT = p.def.atkInterval;
    p.atkAnim = 1;
    const t = this.autoTarget(p, p.def.ranged ? p.def.atkRange + 3 : p.def.atkRange + 0.8);
    if (t) p.faceDir(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
    else { const f = this._camForward(); p.faceDir(f.x, f.z); }
    if (p.def.ranged) {
      const f = p.facing();
      const dir = t
        ? new THREE.Vector3(t.pos.x - p.pos.x, 0, t.pos.z - p.pos.z).normalize()
        : new THREE.Vector3(f.x, 0, f.z);
      let dmg = p.def.atkDmg;
      if (p.empowerT > 0) { dmg *= 1.5; p.empowerT = 0; }
      this.spawnProjectile({ from: p.pos, dir, speed: 30, dmg, team: p.team, owner: p,
        color: PROJ_COLORS[p.heroId] || 0x7dd3fc, life: 0.8 });
      this.sfx.shoot();
    } else {
      this.sfx.melee();
      this.meleeHit(p, p.def.atkRange + 0.8, p.def.atkDmg);
    }
  }

  meleeHit(c, range, dmg) {
    const f = c.facing();
    for (const e of this.chars) {
      if (!e.alive || e.team === c.team) continue;
      const dx = e.pos.x - c.pos.x, dz = e.pos.z - c.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > range) continue;
      const ang = Math.acos(Math.min(1, Math.max(-1, (dx * f.x + dz * f.z) / (d || 1))));
      if (ang < 1.1) e.takeDamage(dmg, c);
    }
  }

  trySkill(slot) {
    const p = this.player;
    if (this.state !== 'playing' || !p || !p.alive || p.stunT > 0 || p.ultLeapT > 0) return;
    if (p.cds[slot] > 0) return;
    if (slot === 'ult') {
      const range = p.def.ranged ? 24 : 18;
      if (!this.autoTarget(p, range)) { this.hud.toast('No enemy in range!'); return; }
    }
    this.castSkill(p, slot);
  }

  // PHASE2: server AbilityResolver re-validates; client sends input only.
  castSkill(c, slot) {
    const def = c.def.skills[slot];
    c.cds[slot] = def.cd;
    if (c.heroId === 'mary') c.swiftT = 2;
    const f = c.isPlayer ? this._camForward() : c.facing();
    if (c.isPlayer) c.faceDir(f.x, f.z);
    const f3 = c.isPlayer ? new THREE.Vector3(f.x, 0, f.z) : new THREE.Vector3(c.facing().x, 0, c.facing().z);

    if (c.heroId === 'george' && slot === 's1') {
      this.spawnRing(c.pos, 0x22d3ee, 7.5);
      this.burst(c.pos, 0x22d3ee, 22, 9, 0.5);
      this.engine.shake(c.isPlayer ? 0.35 : 0.12);
      this.sfx.boom();
      for (const e of this.chars) {
        if (!e.alive || e.team === c.team) continue;
        const dx = e.pos.x - c.pos.x, dz = e.pos.z - c.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < def.radius + 0.5) {
          e.takeDamage(def.dmg, c);
          e.kb.x += (dx / (d || 1)) * 14; e.kb.z += (dz / (d || 1)) * 14;
        }
      }
    } else if (c.heroId === 'george' && slot === 's2') {
      c.dashDir.copy(f3); c.dashT = 0.35; c.dashHit.clear();
      c.shield = 150; c.shieldT = 3;
      this.sfx.dash(); if (c.isPlayer) this.sfx.shield();
      c.refreshLabel();
    } else if (c.heroId === 'george' && slot === 'ult') {
      const t = c.isPlayer ? this.autoTarget(c, 17) : c.ai.target;
      const dest = t ? t.pos.clone() : c.pos.clone().add(new THREE.Vector3(f.x * 9, 0, f.z * 9));
      const d = Math.hypot(dest.x - c.pos.x, dest.z - c.pos.z);
      if (d > 17) { dest.sub(c.pos).multiplyScalar(17 / d).add(c.pos); }
      c.ultFrom.copy(c.pos); c.ultTo.copy(dest); c.ultLeapT = 0.38;
      this.sfx.ultCast();
      if (c.isPlayer) this.hud.toast('TITAN SLAM! ☄️', 1200);
    } else if (c.heroId === 'mary' && slot === 's1') {
      this.spawnProjectile({ from: c.pos, dir: f3, speed: 34, dmg: def.dmg, team: c.team, owner: c,
        color: 0xf0abfc, radius: 0.65, big: true, life: 0.7, pierce: 99 });
      this.sfx.shoot();
      c.atkAnim = 1;
    } else if (c.heroId === 'mary' && slot === 's2') {
      this.burst(c.pos, 0xf0abfc, 12, 4, 0.4);
      c.pos.x += f3.x * 12; c.pos.z += f3.z * 12;
      this._clampToArena(c);
      c.empowerT = 4;
      this.burst(c.pos, 0xf0abfc, 14, 5, 0.5);
      this.sfx.blink();
    } else if (c.heroId === 'mary' && slot === 'ult') {
      this.sfx.ultCast();
      if (c.isPlayer) this.hud.toast('STARFALL! 💫', 1200);
      const foes = this.chars.filter((e) => e.alive && e.team !== c.team)
        .sort((a, b) => a.pos.distanceTo(c.pos) - b.pos.distanceTo(c.pos)).slice(0, 4);
      if (!foes.length) return;
      for (let m = 0; m < 8; m++) {
        const target = foes[m % foes.length];
        this.timers.push({ t: 0.25 + m * 0.14, fn: () => {
          if (this.state !== 'playing') return;
          const at = target.pos.clone();
          this.burst(at, 0xec4899, 4, 1, 0.45);
          this.timers.push({ t: 0.45, fn: () => {
            if (this.state !== 'playing') return;
            this.spawnRing(at, 0xf0abfc, 4.5);
            this.burst(at, 0xfbbf24, 14, 8, 0.5);
            this.burst(at, 0xec4899, 10, 6, 0.4);
            this.sfx.boom();
            if (c.isPlayer) this.engine.shake(0.15);
            for (const e of this.chars) {
              if (!e.alive || e.team === c.team) continue;
              if (Math.hypot(e.pos.x - at.x, e.pos.z - at.z) < 4) e.takeDamage(def.dmg, c);
            }
          }});
        }});
      }
    } else if (c.heroId === 'kaito' && slot === 's1') {
      // Fang Flurry: lunge + double slash
      c.pos.x += f3.x * 2.5; c.pos.z += f3.z * 2.5;
      this._clampToArena(c);
      c.atkAnim = 1;
      this.burst(c.pos, 0xc4b5fd, 8, 6, 0.3);
      this.sfx.melee();
      this.meleeHit(c, c.def.atkRange + 1.2, def.dmg);
      this.timers.push({ t: 0.12, fn: () => { if (c.alive && this.state === 'playing') this.meleeHit(c, c.def.atkRange + 1.2, def.dmg); } });
    } else if (c.heroId === 'kaito' && slot === 's2') {
      // Smoke Step: blink + blast + speed
      this.burst(c.pos, 0x8b5cf6, 12, 4, 0.4);
      c.pos.x += f3.x * 9; c.pos.z += f3.z * 9;
      this._clampToArena(c);
      c.speedBuffT = 3;
      this.spawnRing(c.pos, 0x8b5cf6, def.radius + 0.5);
      this.burst(c.pos, 0x8b5cf6, 12, 6, 0.4);
      this.sfx.blink();
      for (const e of this.chars) {
        if (!e.alive || e.team === c.team) continue;
        if (Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z) < def.radius) e.takeDamage(def.dmg, c);
      }
    } else if (c.heroId === 'kaito' && slot === 'ult') {
      // Shadow Hunt: chain through up to 3 enemies
      const foes = this.chars.filter((e) => e.alive && e.team !== c.team)
        .sort((a, b) => a.pos.distanceTo(c.pos) - b.pos.distanceTo(c.pos)).slice(0, 3);
      if (!foes.length) return;
      this.sfx.ultCast();
      if (c.isPlayer) this.hud.toast('SHADOW HUNT! 🌙', 1200);
      foes.forEach((foe, i) => {
        this.timers.push({ t: 0.15 + i * 0.22, fn: () => {
          if (!c.alive || this.state !== 'playing') return;
          this.burst(c.pos, 0x8b5cf6, 8, 4, 0.3);
          c.pos.set(foe.pos.x - f3.x * 1.5, 0, foe.pos.z - f3.z * 1.5);
          this._clampToArena(c);
          this.spawnRing(c.pos, 0xc4b5fd, 3.5);
          this.burst(c.pos, 0xc4b5fd, 14, 7, 0.4);
          this.sfx.melee();
          if (c.isPlayer) this.engine.shake(0.12);
          if (foe.alive) foe.takeDamage(def.dmg, c);
        }});
      });
    } else if (c.heroId === 'ember' && slot === 's1') {
      // Flame Lance
      this.spawnProjectile({ from: c.pos, dir: f3, speed: 32, dmg: def.dmg, team: c.team, owner: c,
        color: 0xfb923c, radius: 0.65, big: true, life: 0.7, pierce: 99 });
      this.sfx.shoot();
      c.atkAnim = 1;
    } else if (c.heroId === 'ember' && slot === 's2') {
      // Cinder Rush: dash + detonate at stop
      c.dashDir.copy(f3); c.dashT = 0.35; c.dashHit.clear();
      this.sfx.dash();
      this.timers.push({ t: 0.38, fn: () => {
        if (!c.alive || this.state !== 'playing') return;
        this.spawnRing(c.pos, 0xfb923c, def.radius + 1);
        this.burst(c.pos, 0xfb923c, 20, 9, 0.5);
        this.burst(c.pos, 0xfde047, 10, 6, 0.4);
        this.sfx.boom();
        if (c.isPlayer) this.engine.shake(0.2);
        for (const e of this.chars) {
          if (!e.alive || e.team === c.team) continue;
          if (Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z) < def.radius) e.takeDamage(def.dmg, c);
        }
      }});
    } else if (c.heroId === 'ember' && slot === 'ult') {
      // Inferno Bloom: delayed nuke under nearest enemy
      const t = c.isPlayer ? this.autoTarget(c, 24) : c.ai.target;
      if (!t) return;
      this.sfx.ultCast();
      if (c.isPlayer) this.hud.toast('INFERNO BLOOM! 🌋', 1200);
      const at = t.pos.clone();
      this.burst(at, 0xef4444, 10, 2, 0.7);
      this.spawnRing(at, 0xef4444, 2);
      this.timers.push({ t: 0.7, fn: () => {
        if (this.state !== 'playing') return;
        this.spawnRing(at, 0xfb923c, def.radius + 1.5);
        this.spawnRing(at, 0xfde047, def.radius);
        this.burst(at, 0xfb923c, 30, 12, 0.7);
        this.burst(at, 0xef4444, 20, 8, 0.6);
        this.sfx.boom();
        this.engine.shake(c.isPlayer ? 0.45 : 0.15);
        for (const e of this.chars) {
          if (!e.alive || e.team === c.team) continue;
          if (Math.hypot(e.pos.x - at.x, e.pos.z - at.z) < def.radius) {
            e.takeDamage(def.dmg, c);
            e.stunT = Math.max(e.stunT, 1.0);
          }
        }
      }});
    }
  }

  _clampToArena(c) {
    const dd = Math.hypot(c.pos.x, c.pos.z);
    if (dd > MAP_RADIUS) { c.pos.x *= MAP_RADIUS / dd; c.pos.z *= MAP_RADIUS / dd; }
    for (const o of this.colliders) {
      const ox = c.pos.x - o.x, oz = c.pos.z - o.z, od = Math.hypot(ox, oz);
      if (od < o.r + 0.7 && od > 0.001) {
        c.pos.x = o.x + ox / od * (o.r + 0.7);
        c.pos.z = o.z + oz / od * (o.r + 0.7);
      }
    }
  }

  dashDamage(c) {
    const isEmber = c.heroId === 'ember';
    for (const e of this.chars) {
      if (!e.alive || e.team === c.team || c.dashHit.has(e)) continue;
      if (Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z) < 2.2) {
        c.dashHit.add(e);
        e.takeDamage(c.def.skills.s2.dmg * (isEmber ? 0.4 : 1), c);
        if (!isEmber) { e.kb.x += c.dashDir.x * 8; e.kb.z += c.dashDir.z * 8; }
      }
    }
  }

  titanSlam(c) {
    const def = c.def.skills.ult;
    this.spawnRing(c.pos, 0xfbbf24, 9.5);
    this.burst(c.pos, 0xfbbf24, 30, 11, 0.6);
    this.burst(c.pos, 0xfff7ed, 16, 7, 0.4);
    this.engine.shake(c.isPlayer ? 0.5 : 0.2);
    this.sfx.boom();
    for (const e of this.chars) {
      if (!e.alive || e.team === c.team) continue;
      if (Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z) < def.radius + 0.5) {
        e.takeDamage(def.dmg, c);
        e.stunT = Math.max(e.stunT, 1.5);
      }
    }
  }

  // ---------------- 💞 Bond ----------------
  bondStatus() {
    if (this.mode !== 'duo' || !this.player || !this.ally) return { visible: false, ready: false };
    if (!this.player.alive || !this.ally.alive) return { visible: false, ready: false };
    const d = this.player.pos.distanceTo(this.ally.pos);
    return { visible: true, ready: d <= BOND.range && this.player.cds.bond <= 0 };
  }

  tryBond() {
    const p = this.player, a = this.ally;
    if (this.state !== 'playing' || !p || !a || !p.alive || !a.alive) return;
    if (p.cds.bond > 0) return;
    if (p.pos.distanceTo(a.pos) > BOND.range) { this.hud.toast('Too far! Get close 💞'); return; }
    p.cds.bond = BOND.cd;
    this.sfx.bond();
    this.hud.toast('💞 HEARTLINK OVERDRIVE! 💞', 2200);
    this.engine.shake(0.35);
    for (const c of [p, a]) {
      c.heal(c.maxHp * BOND.healPct);
      c.speedBuffT = 5;
      this.spawnRing(c.pos, 0xf472b6, BOND.radius + 1);
      this.burst(c.pos, 0xf472b6, 26, 10, 0.7);
      for (const e of this.chars) {
        if (!e.alive || e.team === c.team) continue;
        if (Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z) < BOND.radius) e.takeDamage(BOND.dmg, p);
      }
    }
  }

  // ---------------- FX pools ----------------
  spawnProjectile(o) {
    let pr = this.projectiles.find((x) => !x.active);
    if (!pr) {
      if (this.projectiles.length >= 60) pr = this.projectiles[0];
      else {
        pr = { mesh: new THREE.Mesh(GEO.proj, glowMat(0xffffff)), active: false, vel: new THREE.Vector3(), hit: new Set() };
        pr.mesh.visible = false;
        this.engine.scene.add(pr.mesh);
        this.projectiles.push(pr);
      }
    }
    pr.active = true; pr.hit.clear();
    pr.mesh.visible = true;
    pr.mesh.geometry = o.big ? GEO.bigProj : GEO.proj;
    pr.mesh.material = glowMat(o.color);
    pr.mesh.position.set(o.from.x, 1.3, o.from.z);
    pr.mesh.scale.setScalar(1);
    pr.vel.copy(o.dir).multiplyScalar(o.speed);
    pr.dmg = o.dmg; pr.team = o.team; pr.owner = o.owner;
    pr.life = o.life || 1.2; pr.radius = o.radius || 0.2; pr.pierce = o.pierce || 0;
    pr.trailT = 0;
  }

  _updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      if (!pr.active) continue;
      pr.life -= dt;
      pr.mesh.position.addScaledVector(pr.vel, dt);
      pr.trailT -= dt;
      if (pr.trailT <= 0) {
        pr.trailT = 0.06;
        this.burst(pr.mesh.position, pr.mesh.material.color.getHex(), 1, 0.5, 0.25);
      }
      const mp = pr.mesh.position;
      let dead = pr.life <= 0 || Math.hypot(mp.x, mp.z) > MAP_RADIUS + 4;
      if (!dead) {
        for (const e of this.chars) {
          if (!e.alive || e.team === pr.team || pr.hit.has(e)) continue;
          if (Math.hypot(e.pos.x - mp.x, e.pos.z - mp.z) < 1.0 + pr.radius) {
            pr.hit.add(e);
            e.takeDamage(pr.dmg, pr.owner);
            if (pr.pierce > 0) pr.pierce--;
            else { dead = true; break; }
          }
        }
      }
      if (dead) { pr.active = false; pr.mesh.visible = false; }
    }
  }

  burst(p, color, n, speed = 6, life = 0.5) {
    n = Math.max(1, Math.round(n * this.particleMul));
    for (let i = 0; i < n; i++) {
      let pt = this.particles.find((x) => x.life <= 0);
      if (!pt) {
        if (this.particles.length >= 160) return;
        const m = new THREE.Mesh(GEO.particle, glowMat(0xffffff));
        m.visible = false;
        this.engine.scene.add(m);
        pt = { m, vel: new THREE.Vector3(), life: 0, max: 1 };
        this.particles.push(pt);
      }
      pt.life = pt.max = life * (0.6 + Math.random() * 0.7);
      pt.m.visible = true;
      pt.m.material = glowMat(color);
      pt.m.position.set(p.x + (Math.random() - 0.5) * 0.8, (p.y || 0) + 1 + Math.random(), p.z + (Math.random() - 0.5) * 0.8);
      const a = Math.random() * Math.PI * 2;
      pt.vel.set(Math.cos(a) * speed * Math.random(), 2 + Math.random() * speed * 0.7, Math.sin(a) * speed * Math.random());
      pt.m.scale.setScalar(0.8 + Math.random() * 0.8);
    }
  }

  _updateParticles(dt) {
    for (const pt of this.particles) {
      if (pt.life <= 0) continue;
      pt.life -= dt;
      if (pt.life <= 0) { pt.m.visible = false; continue; }
      pt.vel.y -= 12 * dt;
      pt.m.position.addScaledVector(pt.vel, dt);
      if (pt.m.position.y < 0.1) pt.m.position.y = 0.1;
      pt.m.scale.setScalar(Math.max(0.01, pt.life / pt.max));
    }
  }

  spawnRing(p, color, maxR) {
    let r = this.rings.find((x) => !x.m.visible);
    if (!r) {
      if (this.rings.length >= 10) r = this.rings[0];
      else {
        const m = new THREE.Mesh(GEO.ringFX, new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        m.rotation.x = -Math.PI / 2; m.visible = false;
        this.engine.scene.add(m);
        r = { m, t: 99, maxR: 5 };
        this.rings.push(r);
      }
    }
    r.m.visible = true;
    r.m.material.color.setHex(color);
    r.m.material.opacity = 0.95;
    r.m.position.set(p.x, 0.15, p.z);
    r.m.scale.setScalar(0.5);
    r.t = 0; r.maxR = maxR;
  }

  _updateRings(dt) {
    for (const r of this.rings) {
      if (!r.m.visible) continue;
      r.t += dt * 2.4;
      if (r.t >= 1) { r.m.visible = false; continue; }
      r.m.scale.setScalar(0.5 + (r.maxR - 0.5) * r.t);
      r.m.material.opacity = 0.95 * (1 - r.t);
    }
  }

  _updateTimers(dt) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].t -= dt;
      if (this.timers[i].t <= 0) {
        const fn = this.timers[i].fn;
        this.timers.splice(i, 1);
        fn();
      }
    }
  }

  // ---------------- Zone ----------------
  _updateZone(dt) {
    const z = this.zone;
    z.t -= dt;
    if (z.mode === 'wait' && z.t <= 0) {
      if (z.phase < this.zonePhases.length) {
        const ph = this.zonePhases[z.phase];
        z.mode = 'shrink'; z.t = ph.shrink;
        z.fromR = z.r; z.toR = Math.max(6, z.r * ph.scale);
        z.fromX = z.cx; z.fromZ = z.cz;
        const maxOff = Math.max(0, z.fromR - z.toR - 2);
        const a = Math.random() * Math.PI * 2, rr = Math.random() * maxOff;
        z.toX = z.fromX + Math.cos(a) * rr; z.toZ = z.fromZ + Math.sin(a) * rr;
        z.dps = ph.dps;
        this.hud.toast('⚠️ ZONE SHRINKING!', 2000);
        this.sfx.zoneWarn();
      } else { z.mode = 'idle'; z.dps = 40; }
    } else if (z.mode === 'shrink') {
      const ph = this.zonePhases[z.phase];
      const t = 1 - Math.max(0, z.t) / ph.shrink;
      z.r = z.fromR + (z.toR - z.fromR) * t;
      z.cx = z.fromX + (z.toX - z.fromX) * t;
      z.cz = z.fromZ + (z.toZ - z.fromZ) * t;
      if (z.t <= 0) {
        z.phase++; z.mode = 'wait';
        z.t = z.phase < this.zonePhases.length ? this.zonePhases[z.phase].wait : 9999;
      }
    }
    this.zoneMesh.position.set(z.cx, 0.12, z.cz);
    this.zoneMesh.scale.setScalar(Math.max(0.1, z.r));
    this.zoneTickT -= dt;
    if (this.zoneTickT <= 0) {
      this.zoneTickT = 0.5;
      for (const c of this.chars) {
        if (!c.alive) continue;
        if (Math.hypot(c.pos.x - z.cx, c.pos.z - z.cz) > z.r) {
          c.takeDamage(z.dps * 0.5, null);
          if (c.isPlayer) this.hud.spawnDmg(c.pos, z.dps * 0.5, 'zone');
        }
      }
    }
  }

  zoneText() {
    const z = this.zone;
    if (!z) return { text: '', danger: false };
    if (z.mode === 'shrink') return { text: '⚠️ SHRINKING!', danger: true };
    if (z.mode === 'wait' && z.phase < this.zonePhases.length)
      return { text: `Zone shrinks in ${Math.ceil(z.t)}s`, danger: z.t < 5 };
    return { text: 'Final zone — SURVIVE', danger: true };
  }

  // ---------------- Kills / match end ----------------
  onKill(killer, victim) {
    this.burst(victim.pos, victim.team === 0 ? 0x4ade80 : 0xef4444, 18, 7, 0.6);
    if (!this.firstBlood) {
      this.firstBlood = true;
      this.hud.toast('🩸 FIRST BLOOD!', 1600);
    }
    const kn = killer ? killer.name : '⚡ Zone';
    this.hud.killfeed(`💀 <b>${kn}</b> ⚔️ ${victim.name}`);
    if (killer && killer !== victim) {
      killer.kills++;
      if (killer.isPlayer) {
        this.sfx.kill();
        this.killStreak = this.killStreak.filter((t) => this.time - t < 4);
        this.killStreak.push(this.time);
        if (this.killStreak.length === 2) this.hud.toast('DOUBLE KILL! 🔥');
        else if (this.killStreak.length === 3) this.hud.toast('TRIPLE KILL! 🔥🔥');
        else if (this.killStreak.length >= 4) this.hud.toast('RAMPAGE! 🔥🔥🔥');
        else this.hud.toast(`You slew ${victim.name}!`, 1100);
      }
      if (victim.isPlayer && killer && !killer.isPlayer) this.hud.toast(`${killer.name} got you…`, 1600);
    }
    if (victim.isPlayer) { this.sfx.death(); this.engine.shake(0.4); }

    const p = this.player;
    const myTeamAlive = this.chars.some((c) => c.alive && c.team === 0);
    const foesAlive = this.chars.some((c) => c.alive && c.team !== 0);
    if (!myTeamAlive) {
      const placement = this.aliveTeams().size + 1;
      this.endMatch(false, placement, false);
    } else if (!foesAlive) {
      const loveWin = this.mode === 'duo' && !p.alive && this.ally && this.ally.alive;
      this.endMatch(true, 1, loveWin);
    } else if (!p.alive && this.mode === 'duo' && this.ally && this.ally.alive) {
      this.hud.toast('You fell… spectating 💞', 2000);
    }
  }

  endMatch(win, placement, loveWin) {
    if (this.state !== 'playing') return;
    this.state = 'over';
    this.overT = 0;
    this.input.setPlaying(false);
    this.music.stop();
    if (win) this.sfx.win(); else this.sfx.lose();
    const reward = social.awardMatch({ win, placement, kills: this.player.kills, ranked: this.ranked });
    this.lastResult = { win, placement, reward, ranked: this.ranked };
    setTimeout(() => {
      this.hud.showEnd({
        win, placement, total: this.chars.length,
        kills: this.player.kills, dmg: this.player.dmg, time: this.time,
        heroName: this.player.def.name, loveWin,
        rp: reward.rp, coins: reward.coins, ranked: this.ranked, tier: social.tier(),
      });
    }, win ? 1800 : 1400);
  }
}
