import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { InputManager } from './core/InputManager.js';
import { SFX } from './audio/SFX.js';
import { Music } from './audio/Music.js';
import { Game } from './game/Game.js';
import { HEROES } from './game/heroes.js';
import { Lobby } from './ui/Lobby.js';
import { HUD } from './ui/HUD.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TIPS = [
  'Tip: stay inside the zone ring.',
  'Tip: your ULT charges fastest in combat.',
  'Tip: duo partners can revive each other.',
  'Tip: high ground lets ranged heroes poke safely.',
  'Tip: dash through enemies to dodge skill shots.',
  'Tip: claim your daily gift coins in the lobby.',
];

function toastErr(msg) {
  const el = $('err-toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Landscape enforcement.
function checkRotate() {
  const portrait = window.innerHeight > window.innerWidth * 1.05;
  $('rotate-block').classList.toggle('open', portrait);
}
window.addEventListener('resize', checkRotate);
window.addEventListener('orientationchange', checkRotate);
checkRotate();

const DEMO = new URLSearchParams(location.search).get('demo') === '1';

boot().catch((e) => {
  console.error(e);
  const tip = $('splash-tip');
  if (tip) tip.textContent = 'Failed to load: ' + (e.message || e) + ' — tap to retry';
  const sp = $('splash');
  if (sp) sp.onclick = () => location.reload();
});

async function boot() {
  const fill = $('splash-bar-fill');
  const tip = $('splash-tip');
  const setP = (p, t) => { if (fill) fill.style.width = p + '%'; if (t && tip) tip.textContent = t; };

  setP(10, 'Loading engine…');
  await sleep(30);
  const engine = new Engine($('game-canvas'));
  const input = new InputManager();
  const sfx = new SFX();
  const music = new Music();
  setP(40, 'Building heroes…');
  await sleep(30);
  const hud = new HUD();
  const game = new Game(engine, input, hud, sfx, music);
  setP(70, 'Preparing lobby…');
  await sleep(30);

  if (DEMO) {
    document.body.classList.add('demo');
    $('splash')?.remove();
    game.startMatch({ heroId: 'george', mode: 'solo', playerName: 'Demo', ranked: false });
    hud.bindActions(game, sfx, music);
    input.setPlaying(false);
    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, clock.getDelta());
      game.update(dt);
      engine.render();
    })();
    return;
  }

  const lobby = new Lobby({ game, hud, input, sfx, music, engine });
  lobby.init();
  hud.bindActions(game, sfx, music);
  setP(95, 'Almost there…');
  await sleep(60);

  let mmCancelled = false;
  let lastCfg = { heroId: 'george', mode: 'classic', squadMode: 'solo', playerName: 'George' };

  lobby.on('start', (cfg) => startFlow(cfg));
  $('mm-cancel').onclick = () => { mmCancelled = true; };
  $('btn-again').onclick = () => { sfx.click(); hud.showScreen(null); startFlow(lastCfg); };
  $('btn-lobby').onclick = () => { sfx.click(); hud.showScreen(null); toLobby(); };

  window.__meyaBooted = true;
  setP(100, 'Ready!');
  const tap = $('tap-start');
  if (tap) tap.style.display = 'block';
  if (tip) tip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  $('splash').onclick = () => {
    sfx.init(); sfx.resume(); music.ensure(); music.resume();
    sfx.click();
    $('splash').classList.add('hidden');
    toLobby();
  };

  // Main loop.
  const clock = new THREE.Clock();
  let fpsEma = 60;
  (function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    game.update(dt);
    try { hud.sync(game, dt); } catch (e) { /* lobby frames have no player yet */ }
    engine.render();
    if (dt > 0) {
      fpsEma += (1 / dt - fpsEma) * 0.05;
      engine.updateAuto(dt, fpsEma);
      hud.setFPS(Math.round(fpsEma) + ' FPS');
    }
  })();

  function toLobby() {
    input.setPlaying(false);
    hud.showScreen(null);
    lobby.show();
    music.start('menu');
  }

  async function startFlow(cfg) {
    lastCfg = cfg;
    mmCancelled = false;
    lobby.hide();
    $('mm-mode').textContent = `${cfg.mode.toUpperCase()} · ${cfg.squadMode.toUpperCase()}`;
    $('matchmaking').classList.add('open');
    const count = $('mm-count');
    const bar = $('mm-bar-fill');
    $('mm-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    const total = 10;
    for (let n = 1; n <= total; n++) {
      if (mmCancelled) {
        $('matchmaking').classList.remove('open');
        toLobby();
        return;
      }
      count.textContent = `${n}/${total}`;
      bar.style.width = (n / total * 100) + '%';
      if (n % 3 === 0) { try { sfx.click(); } catch (e) {} }
      await sleep(150 + Math.random() * 160);
    }
    $('matchmaking').classList.remove('open');
    // Versus splash.
    $('vs-mode').textContent = `10 FIGHTERS · ${cfg.squadMode === 'duo' ? 'DUOS' : 'ONE SURVIVOR'}`;
    $('versus').classList.add('open');
    const vb = $('vs-bar-fill');
    vb.style.width = '0%';
    await sleep(60);
    vb.style.transition = 'width 1.1s linear';
    vb.style.width = '100%';
    await sleep(1250);
    vb.style.transition = '';
    $('versus').classList.remove('open');
    // Battle. (startMatch plays battle music + shows toasts itself.)
    try {
      game.startMatch({
        heroId: cfg.heroId,
        mode: cfg.squadMode === 'duo' ? 'duo' : 'solo',
        playerName: cfg.playerName,
        ranked: cfg.mode === 'ranked',
      });
    } catch (e) {
      console.error(e);
      toastErr('Match failed to start — back to lobby.');
      toLobby();
      return;
    }
    hud.setHeroBadge(HEROES[cfg.heroId] || HEROES.george);
    hud.bindActions(game, sfx, music);
    hud.showScreen('hud');
    input.setPlaying(true);
  }
}
