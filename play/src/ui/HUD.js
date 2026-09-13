// Meya Arena — HUD.js
// All DOM UI: health, ML-style ability buttons with cooldown sweep, minimap,
// killfeed, toasts, damage numbers, end screen with ranked rewards.

import * as THREE from 'three';
import { MAP_RADIUS } from '../core/constants.js';

const _v = new THREE.Vector3();
function el(id) { return document.getElementById(id); }
function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export class HUD {
  constructor() {
    this.e = {
      hpFill: el('hp-fill'), hpText: el('hp-text'), shield: el('shield-fill'),
      heroIcon: el('hero-icon'), kills: el('kills-count'),
      alive: el('alive-count'), timer: el('match-timer'), zone: el('zone-pill'),
      fps: el('fps-label'), feed: el('killfeed'), toast: el('toast'),
      countdown: el('countdown'), spectate: el('spectate-label'),
      vignette: el('vignette'), dmgLayer: el('dmg-layer'),
      mute: el('btn-mute'),
      attack: el('btn-attack'), s1: el('btn-s1'), s2: el('btn-s2'),
      ult: el('btn-ult'), bond: el('btn-bond'),
      mmap: el('minimap-canvas').getContext('2d'),
      menu: el('main-menu'), end: el('end-screen'), loading: el('loading-screen'),
    };
    this.btns = {
      attack: this._btn('btn-attack'), s1: this._btn('btn-s1'), s2: this._btn('btn-s2'),
      ult: this._btn('btn-ult'), bond: this._btn('btn-bond'),
    };
    this._toastT = null; this._syncT = 0; this._mapT = 0;
    this._bound = false;
    this.dmgNums = [];
    this._dmgPool = [];
  }

  _btn(id) {
    const b = el(id);
    return { root: b, cd: b.querySelector('.cd'), ico: b.querySelector('.ico') };
  }

  bindActions(game, sfx, music) {
    // Listeners bind ONCE (matches restart without duplicating handlers)…
    if (!this._bound) {
      this._bound = true;
      const press = (id, fn) => {
        const b = el(id);
        b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); fn(); });
      };
      press('btn-attack', () => game.tryAttack());
      press('btn-s1', () => game.trySkill('s1'));
      press('btn-s2', () => game.trySkill('s2'));
      press('btn-ult', () => game.trySkill('ult'));
      press('btn-bond', () => game.tryBond());
      this.e.mute.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = sfx.toggleMute();
        if (music) music.setMuted(m);
        this.e.mute.textContent = m ? '🔇' : '🔊';
      });
    }
    // …but per-hero icons refresh every match.
    const d = game.playerDef();
    this.btns.s1.ico.textContent = d.skills.s1.icon;
    this.btns.s2.ico.textContent = d.skills.s2.icon;
    this.btns.ult.ico.textContent = d.skills.ult.icon;
  }

  showScreen(name) {
    document.body.classList.toggle('playing', name === 'hud');
    this.e.menu.classList.toggle('hidden', name !== 'menu');
    this.e.end.classList.toggle('hidden', name !== 'end');
    this.e.loading.style.display = 'none';
  }

  setHeroBadge(def) {
    this.e.heroIcon.textContent = def.name[0];
    this.e.heroIcon.style.background = def.css;
  }

  killfeed(html) {
    const row = document.createElement('div');
    row.className = 'kf-row'; row.innerHTML = html;
    this.e.feed.prepend(row);
    while (this.e.feed.children.length > 4) this.e.feed.lastChild.remove();
    setTimeout(() => { row.style.transition = 'opacity .5s'; row.style.opacity = '0'; setTimeout(() => row.remove(), 500); }, 4200);
  }

  toast(msg, ms = 1800) {
    this.e.toast.textContent = msg;
    this.e.toast.style.opacity = '1';
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { this.e.toast.style.opacity = '0'; }, ms);
  }

  countdown(txt) {
    this.e.countdown.textContent = txt || '';
    this.e.countdown.style.display = txt ? 'block' : 'none';
  }

  damageFlash() {
    this.e.vignette.style.opacity = '1';
    setTimeout(() => { this.e.vignette.style.opacity = '0'; }, 130);
  }

  setFPS(txt) { this.e.fps.textContent = txt; }
  setSpectate(name) {
    this.e.spectate.style.display = name ? 'block' : 'none';
    if (name) this.e.spectate.textContent = '👁 Spectating ' + name + '…';
  }

  showEnd(o) {
    el('end-emoji').textContent = o.win ? '🏆' : '💀';
    const t = el('end-title');
    t.textContent = o.win ? (o.loveWin ? 'LOVE WINS! 💞' : 'VICTORY!') : 'DEFEATED';
    t.className = o.win ? 'win' : 'lose';
    const rpTxt = o.rp >= 0 ? `+${o.rp} RP` : `${o.rp} RP`;
    const tierTxt = o.ranked && o.tier ? ` · ${o.tier.icon} ${o.tier.name}` : '';
    el('end-place').textContent = `#${o.placement} of ${o.total} · ${rpTxt} · +${o.coins} 🪙${tierTxt}`;
    el('stat-kills').textContent = o.kills;
    el('stat-dmg').textContent = Math.round(o.dmg);
    el('stat-time').textContent = fmtTime(o.time);
    el('stat-hero').textContent = o.heroName;
    this.showScreen('end');
  }

  spawnDmg(world, amount, kind) {
    if (this.dmgNums.length > 14) return;
    let d = this._dmgPool.pop();
    if (!d) { d = document.createElement('div'); this.e.dmgLayer.appendChild(d); }
    d.className = 'dmg-num ' + kind;
    d.textContent = (kind === 'heal' ? '+' : '') + Math.round(amount);
    d.style.display = 'block';
    this.dmgNums.push({ el: d, x: world.x, y: world.y + 2.4, z: world.z, t: 0 });
  }

  _setCd(btn, frac, secs) {
    const pct = Math.min(100, Math.max(0, frac * 100));
    btn.cd.style.background = pct <= 0
      ? 'conic-gradient(rgba(0,0,0,0) 0%, transparent 0%)'
      : `conic-gradient(rgba(0,0,0,.78) ${pct}%, transparent ${pct}%)`;
    btn.cd.textContent = secs > 0.4 ? Math.ceil(secs) : '';
  }

  sync(game, dt) {
    const cam = game.engine.camera;
    const W = window.innerWidth, H = window.innerHeight;
    for (let i = this.dmgNums.length - 1; i >= 0; i--) {
      const d = this.dmgNums[i];
      d.t += dt; d.y += dt * 1.6;
      if (d.t > 0.9) {
        d.el.style.display = 'none'; this._dmgPool.push(d.el);
        this.dmgNums.splice(i, 1); continue;
      }
      _v.set(d.x, d.y, d.z).project(cam);
      d.el.style.left = ((_v.x * 0.5 + 0.5) * W) + 'px';
      d.el.style.top = ((-_v.y * 0.5 + 0.5) * H) + 'px';
      d.el.style.opacity = String(1 - d.t / 0.9);
    }

    this._syncT -= dt;
    if (this._syncT > 0) return;
    this._syncT = 1 / 15;

    const p = game.player;
    if (!p) return;
    const frac = Math.max(0, p.hp / p.maxHp);
    this.e.hpFill.style.width = (frac * 100) + '%';
    this.e.hpFill.style.background = frac > 0.5
      ? 'linear-gradient(90deg,#22c55e,#4ade80)'
      : frac > 0.25 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#ef4444)';
    this.e.hpText.textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
    this.e.shield.style.width = p.shield > 0 ? Math.min(100, p.shield / p.maxHp * 100) + '%' : '0%';
    this.e.kills.textContent = `💀 ${p.kills} kills`;
    this.e.alive.textContent = `👥 ${game.aliveCount()}`;
    this.e.timer.textContent = fmtTime(game.time);

    const zt = game.zoneText();
    this.e.zone.textContent = zt.text;
    this.e.zone.classList.toggle('danger', zt.danger);

    const d = p.def;
    this._setCd(this.btns.attack, p.atkT / d.atkInterval, p.atkT);
    this._setCd(this.btns.s1, p.cds.s1 / d.skills.s1.cd, p.cds.s1);
    this._setCd(this.btns.s2, p.cds.s2 / d.skills.s2.cd, p.cds.s2);
    this._setCd(this.btns.ult, p.cds.ult / d.skills.ult.cd, p.cds.ult);
    this.btns.ult.root.classList.toggle('ult-ready', p.cds.ult <= 0 && p.alive);

    const b = game.bondStatus();
    this.btns.bond.root.classList.toggle('show', b.visible);
    this.btns.bond.root.classList.toggle('far', b.visible && !b.ready);
    this.btns.bond.root.classList.toggle('ready', b.ready);
    this._setCd(this.btns.bond, p.cds.bond / 45, p.cds.bond);

    this._mapT -= 1 / 15;
    if (this._mapT <= 0) { this._mapT = 0.1; this._drawMinimap(game); }
  }

  _drawMinimap(game) {
    const c = this.e.mmap, S = 264, R = S / 2;
    const w2m = (x) => R + (x / (MAP_RADIUS + 12)) * (R - 6);
    c.clearRect(0, 0, S, S);
    c.beginPath(); c.arc(R, R, R - 2, 0, 7); c.fillStyle = 'rgba(20,30,60,.9)'; c.fill();
    const z = game.zone;
    c.beginPath(); c.arc(w2m(z.cx), w2m(z.cz), Math.max(2, z.r / (MAP_RADIUS + 12) * (R - 6)), 0, 7);
    c.strokeStyle = '#4ade80'; c.lineWidth = 3; c.stroke();
    for (const ch of game.chars) {
      if (!ch.alive) continue;
      c.beginPath(); c.arc(w2m(ch.pos.x), w2m(ch.pos.z), ch.isPlayer ? 6 : 4, 0, 7);
      c.fillStyle = ch.isPlayer ? '#fff' : (ch.team === 0 ? '#4ade80' : '#ef4444');
      c.fill();
    }
  }
}
