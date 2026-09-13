// Meya Arena — Match Server v0.2 (Phase 2: matchmaking + rooms + ranked store).
// Deploy: Render.com Web Service (free tier), `npm install && npm start`.
// Client netcode (net/SocketClient + prediction + reconciliation) plugs into
// Game.js's marked seams. Protocol version must match client.

import { WebSocketServer } from 'ws';
import { TICK_RATE } from '../../shared/constants.js';

const PORT = process.env.PORT || 8080;
const PROTO = 2;
const wss = new WebSocketServer({ port: PORT });

// ---- In-memory stores (Phase 2.1 moves these to Redis/Firestore) ----
const queue = [];                 // { ws, id, mode, ranked, mmr, region, t }
const rooms = new Map();          // roomId -> Room
const ratings = new Map();        // playerId -> { mmr, tier }
let nextRoom = 1, nextSeq = 1;

const TEAM_SIZE = { solo: 10, duo: 10 };   // players per match
const tierOf = (mmr) => mmr < 400 ? 'Bronze' : mmr < 800 ? 'Silver' : mmr < 1200 ? 'Gold'
  : mmr < 1600 ? 'Platinum' : mmr < 2200 ? 'Diamond' : 'Mythic';

console.log(`[meya-arena] server v0.2 proto=${PROTO} :${PORT} @${TICK_RATE}Hz`);

wss.on('connection', (ws) => {
  const me = { ws, id: null, room: null, lastInput: 0 };
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.v !== PROTO) return ws.send(JSON.stringify({ t: 'error', msg: 'proto-mismatch' }));
    if (m.t === 'hello') {
      me.id = String(m.id || 'anon-' + nextSeq++);
      if (!ratings.has(me.id)) ratings.set(me.id, { mmr: 1000, tier: 'Gold' });
      ws.send(JSON.stringify({ t: 'hello', id: me.id, rating: ratings.get(me.id) }));
    } else if (m.t === 'queue') {
      if (!me.id) return;
      queue.push({ ws, id: me.id, mode: m.mode === 'duo' ? 'duo' : 'solo',
        ranked: !!m.ranked, region: m.region || 'auto',
        mmr: ratings.get(me.id).mmr, t: Date.now() });
      ws.send(JSON.stringify({ t: 'queued', ahead: queue.length }));
      tryMatch();
    } else if (m.t === 'leave-queue') {
      const i = queue.findIndex((q) => q.ws === ws);
      if (i >= 0) queue.splice(i, 1);
    } else if (m.t === 'input' && me.room) {
      // Anti-cheat seam: InputValidator checks rate + plausibility here.
      if (Date.now() - me.lastInput < 15) return; // >66Hz = drop
      me.lastInput = Date.now();
      me.room.onInput(me.id, m);
    }
  });
  ws.on('close', () => {
    const i = queue.findIndex((q) => q.ws === ws);
    if (i >= 0) queue.splice(i, 1);
    if (me.room) me.room.onDisconnect(me.id);
  });
});

// ---- MMR matchmaking: group same mode+ranked, nearest MMR, widen with wait ----
function tryMatch() {
  for (const mode of ['solo', 'duo']) for (const ranked of [false, true]) {
    const pool = queue.filter((q) => q.mode === mode && q.ranked === ranked);
    const need = TEAM_SIZE[mode];
    if (pool.length < need) continue;
    pool.sort((a, b) => a.mmr - b.mmr);
    // Slide a window to find the tightest MMR group of `need`.
    let best = 0, bestSpread = Infinity;
    for (let i = 0; i + need <= pool.length; i++) {
      const spread = pool[i + need - 1].mmr - pool[i].mmr;
      const waited = (Date.now() - pool[i].t) / 1000;
      const score = spread - Math.min(600, waited * 20); // waiting widens range
      if (score < bestSpread) { bestSpread = score; best = i; }
    }
    const members = pool.slice(best, best + need);
    for (const m of members) queue.splice(queue.indexOf(m), 1);
    const id = 'room-' + nextRoom++;
    const room = new Room(id, members);
    rooms.set(id, room);
    console.log(`[meya-arena] ${id} ${mode}${ranked ? '+ranked' : ''} spread=${Math.round(bestSpread)}`);
  }
}

class Room {
  constructor(id, members) {
    this.id = id; this.tick = 0;
    this.players = new Map(); // id -> { ws, hero, x, z, hp, alive, team, kills }
    members.forEach((m, i) => {
      const a = (i / members.length) * Math.PI * 2;
      this.players.set(m.id, { ws: m.ws, hero: 'george', x: Math.cos(a) * 46, z: Math.sin(a) * 46,
        hp: 1000, alive: true, team: m.mode === 'duo' ? Math.floor(i / 2) : 100 + i, kills: 0, input: null });
      m.ws.send(JSON.stringify({ t: 'match', room: id, slot: i }));
    });
    this.zone = { cx: 0, cz: 0, r: 62, phase: 0 };
    this.timer = setInterval(() => this.step(), 1000 / TICK_RATE);
    this.over = false;
  }
  onInput(id, m) { const p = this.players.get(id); if (p && p.alive) p.input = m; }
  onDisconnect(id) { const p = this.players.get(id); if (p) { p.alive = false; p.gone = true; } }

  step() {
    if (this.over) return;
    this.tick++;
    // TODO (Phase 2.2): port Game.js sim — movement, AbilityResolver casts,
    // projectiles, ZoneController, deaths. Snapshot below is the wire format.
    const snap = { t: 'snap', tick: this.tick, zone: this.zone, ents: [] };
    for (const [id, p] of this.players) {
      // Stub movement so protocol can be tested end-to-end before full sim:
      if (p.input && p.alive) {
        p.x += (p.input.move?.x || 0) * 0.35;
        p.z += (p.input.move?.y || 0) * 0.35;
        p.input = null;
      }
      snap.ents.push({ id, x: +p.x.toFixed(2), z: +p.z.toFixed(2), hp: Math.ceil(p.hp), alive: p.alive });
    }
    const s = JSON.stringify(snap);
    for (const [, p] of this.players) {
      if (p.ws.readyState === 1) p.ws.send(s);
    }
    if (this.tick > TICK_RATE * 60 * 12) this.finish(null); // 12-min cap
  }

  finish(winnerId) {
    this.over = true;
    clearInterval(this.timer);
    for (const [id, p] of this.players) {
      const r = ratings.get(id);
      if (r) { // placeholder ranked delta; real formula in Phase 2.2
        r.mmr = Math.max(0, r.mmr + (id === winnerId ? 40 : -12));
        r.tier = tierOf(r.mmr);
      }
      if (p.ws.readyState === 1) p.ws.send(JSON.stringify({ t: 'over', winner: winnerId, rating: r }));
    }
    rooms.delete(this.id);
  }
}

// Queue ticker: retry matching as wait tolerance grows.
setInterval(tryMatch, 2000);
