// Meya Arena — main.js (boot sequence, v1.1 with lobby + music + demo mode)
// ?demo=1 → silent auto-playing showcase match (used as the website's live background).
import { Engine } from './core/Engine.js';
import { InputManager } from './core/InputManager.js';
import { HUD } from './ui/HUD.js';
import { SFX } from './audio/SFX.js';
import { Music } from './audio/Music.js';
import { Lobby } from './ui/Lobby.js';
import { Game } from './game/Game.js';
import { HEROES } from './game/heroes.js';

const $ = (id) => document.getElementById(id);
const DEMO = new URLSearchParams(location.search).has('demo') ||
             new URLSearchParams(location.search).has('embed');

let selectedHero = 'george';
let selectedMode = 'solo';
let lastRanked = false, lastSquad = 'solo';
const DEMO_HEROES = ['george', 'mary', 'kaito', 'ember'];
let demoHeroI = 0;

function buildHeroCards() {
  const wrap = $('hero-cards');
  wrap.innerHTML = '';
  for (const id of Object.keys(HEROES)) {
    const h = HEROES[id];
    const card = document.createElement('div');
    card.className = 'hero-card' + (id === selectedHero ? ' selected' : '');
    card.style.setProperty('--hc', h.css);
    card.style.setProperty('--hg', h.glow);
    card.innerHTML = `
      <h3><span>${h.name}</span> · ${h.title}</h3>
      <div class="hero-title">${h.role}</div>
      <div class="role-chip">${h.passive}</div>
      <div class="stat-row"><label>HP</label><div class="stat-bar"><i style="width:${h.bars.hp}%"></i></div></div>
      <div class="stat-row"><label>ATK</label><div class="stat-bar"><i style="width:${h.bars.atk}%"></i></div></div>
      <div class="stat-row"><label>SPD</label><div class="stat-bar"><i style="width:${h.bars.spd}%"></i></div></div>
      <ul class="skill-list">
        <li><b>${h.skills.s1.icon} ${h.skills.s1.name}</b> (${h.skills.s1.cd}s) — ${h.skills.s1.desc}</li>
        <li><b>${h.skills.s2.icon} ${h.skills.s2.name}</b> (${h.skills.s2.cd}s) — ${h.skills.s2.desc}</li>
        <li><b>${h.skills.ult.icon} ${h.skills.ult.name}</b> (ULT ${h.skills.ult.cd}s) — ${h.skills.ult.desc}</li>
      </ul>
      <p class="hero-desc">${h.desc}</p>`;
    card.addEventListener('click', () => {
      selectedHero = id;
      sfx.click();
      wrap.querySelectorAll('.hero-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    wrap.appendChild(card);
  }
}

function bindPills(rowId, attr, cb) {
  const row = $(rowId);
  row.querySelectorAll('.pill').forEach((p) => {
    p.addEventListener('click', () => {
      row.querySelectorAll('.pill').forEach((x) => x.classList.remove('selected'));
      p.classList.add('selected');
      sfx.click();
      cb(p.dataset[attr]);
    });
  });
}

// ---- Boot ----
const canvas = $('game-canvas');
const engine = new Engine(canvas);
const sfx = new SFX();
const music = new Music();
const hud = new HUD();
const input = new InputManager();
const game = new Game(engine, input, hud, sfx, music);
const lobby = new Lobby(music);

if (DEMO) { music.disabled = true; sfx.muted = true; document.body.classList.add('demo'); }

engine.onTierChange = (tier) => { game.particleMul = { high: 1, medium: 0.7, low: 0.4 }[tier]; };
game.particleMul = { high: 1, medium: 0.7, low: 0.4 }[engine.tier];

buildHeroCards();
bindPills('mode-row', 'mode', (m) => { selectedMode = m; });
bindPills('gfx-row', 'q', (q) => engine.setQualityMode(q));

function playerName() {
  return ($('player-name').value || 'George').trim().slice(0, 12) || 'George';
}

function startMatch() {
  hud.setHeroBadge(HEROES[selectedHero]);
  hud.bindActions(game, sfx, music);
  hud.showScreen('hud');
  input.setPlaying(!DEMO);
  game.startMatch({ heroId: selectedHero, mode: lastSquad, playerName: DEMO ? 'Showcase' : playerName(), ranked: lastRanked });
  if (DEMO && game.player) {
    // Showcase tankiness + cinematic drift handled in loop.
    game.player.maxHp *= 3; game.player.hp = game.player.maxHp;
    game.player.refreshLabel();
  }
}

function startDemo() {
  selectedHero = DEMO_HEROES[demoHeroI % DEMO_HEROES.length];
  demoHeroI++;
  lastSquad = 'solo'; lastRanked = false;
  startMatch();
}

if (!DEMO) {
  $('btn-play').addEventListener('click', () => {
    sfx.init(); sfx.resume(); sfx.click();
    hud.showScreen('menu');
    lobby.open(selectedHero, playerName());
    lobby.squad = selectedMode;
    lobby.render();
  });
  lobby.onStart = ({ ranked, squad }) => {
    lastRanked = ranked; lastSquad = squad; selectedMode = squad;
    sfx.click();
    startMatch();
  };
  $('btn-again').addEventListener('click', () => { sfx.click(); startMatch(); });
  $('btn-menu2').addEventListener('click', () => {
    sfx.click();
    input.setPlaying(false);
    hud.showScreen('menu');
    music.start('menu');
    buildHeroCards();
  });
}

let booted = false;

// ---- Main loop ----
let last = performance.now(), fpsEMA = 60, fpsHudT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  const fps = 1 / Math.max(dt, 1e-4);
  fpsEMA += (fps - fpsEMA) * 0.05;

  if (DEMO) {
    if (game.state === 'idle') startDemo();
    else if (game.state === 'playing') {
      // AI drives the showcase player; slow cinematic camera drift.
      if (game.player && game.player.alive) game.updateBot(game.player, dt);
      game.update(dt);
      game.camYaw += dt * 0.06;
    } else if (game.state === 'over') {
      game.updateOver(dt);
      if (game.overT > 4) startDemo(); // next hero showcase
    }
  } else if (game.state === 'playing' || game.state === 'over') {
    if (game.state === 'playing') game.update(dt);
    else game.updateOver(dt);
    hud.sync(game, dt);
  }
  engine.updateAuto(dt, fpsEMA);
  engine.render();

  fpsHudT -= dt;
  if (fpsHudT <= 0) {
    fpsHudT = 0.5;
    hud.setFPS(`${Math.round(fpsEMA)} FPS · ${engine.tier.toUpperCase()}`);
  }
  if (!booted) {
    booted = true;
    window.__meyaBooted = true; // boot failsafe in index.html watches this
    if (!DEMO) hud.showScreen('menu');
    else hud.e.loading.style.display = 'none';
  }
}
requestAnimationFrame(loop);
