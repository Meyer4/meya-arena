// Meya Arena — Lobby.js
// Pre-match lobby: profile + rank, Classic/Ranked modes, Friends, Gifts, Skins.
// Injects its own DOM+CSS (no index.html edits needed). Works offline via Social.

import { HEROES, SKINS } from '../game/heroes.js';
import { social } from '../social/Social.js';

const CSS = `
#lobby{position:fixed;inset:0;z-index:9;display:none;overflow-y:auto;
  background:radial-gradient(ellipse at 50% 0%,#1e1b4b 0%,#0b1026 62%);}
#lobby.open{display:block;}
#lobby .lobby-wrap{max-width:760px;margin:0 auto;padding:18px 14px 40px;}
#lobby .prof{display:flex;align-items:center;gap:12px;background:rgba(15,23,42,.85);
  border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:12px 16px;}
#lobby .avatar{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  font-size:24px;font-weight:900;color:#0b1026;}
#lobby .pinfo{flex:1;text-align:left;}
#lobby .pinfo b{font-size:17px;} #lobby .pinfo .id{font-size:11px;color:#64748b;font-weight:700;}
#lobby .rankbox{text-align:right;font-size:13px;font-weight:800;}
#lobby .rankbar{width:130px;height:7px;border-radius:4px;background:rgba(255,255,255,.12);margin-top:4px;overflow:hidden;}
#lobby .rankbar i{display:block;height:100%;border-radius:4px;}
#lobby .coins{font-size:14px;font-weight:800;color:#fde047;margin-top:4px;}
#lobby .tabs{display:flex;gap:8px;margin:14px 0;}
#lobby .tab{flex:1;padding:11px 0;border-radius:12px;border:2px solid rgba(255,255,255,.14);text-align:center;
  font-weight:900;font-size:14px;cursor:pointer;background:rgba(15,23,42,.7);color:#cbd5e1;}
#lobby .tab.sel{border-color:#fbbf24;color:#fde047;background:rgba(251,191,36,.1);}
#lobby .tab .dot{display:inline-block;min-width:20px;height:20px;line-height:20px;border-radius:10px;
  background:#ef4444;color:#fff;font-size:11px;margin-left:4px;padding:0 5px;}
#lobby .pane{display:none;} #lobby .pane.sel{display:block;}
#lobby .mode{display:flex;gap:10px;margin-bottom:12px;}
#lobby .modecard{flex:1;border-radius:16px;padding:18px 12px;text-align:center;cursor:pointer;
  border:2px solid rgba(255,255,255,.14);background:rgba(15,23,42,.8);}
#lobby .modecard.sel{border-color:#22d3ee;box-shadow:0 0 20px rgba(34,211,238,.3);}
#lobby .modecard h3{margin:0 0 4px;font-size:18px;} #lobby .modecard p{margin:0;font-size:12px;color:#94a3b8;}
#lobby .squadopts{display:flex;gap:10px;margin-bottom:14px;}
#lobby .squadopts .modecard{padding:12px 8px;}
#lobby #lobby-start{width:100%;padding:16px;font-size:20px;font-weight:900;letter-spacing:2px;border:none;
  border-radius:16px;cursor:pointer;color:#0b1026;background:linear-gradient(180deg,#fde047,#f59e0b);
  box-shadow:0 6px 26px rgba(245,158,11,.45);}
#lobby .rowcard{display:flex;align-items:center;gap:10px;background:rgba(15,23,42,.8);
  border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 14px;margin:8px 0;text-align:left;}
#lobby .rowcard .grow{flex:1;} #lobby .rowcard b{font-size:15px;}
#lobby .rowcard small{display:block;color:#94a3b8;font-size:12px;}
#lobby .online{font-size:11px;font-weight:800;color:#4ade80;} #lobby .offline{font-size:11px;font-weight:800;color:#64748b;}
#lobby .mini{padding:8px 14px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;border:none;font-family:inherit;}
#lobby .green{background:#16a34a;color:#fff;} #lobby .red{background:transparent;border:1px solid #64748b;color:#cbd5e1;}
#lobby .gold{background:linear-gradient(180deg,#fde047,#f59e0b);color:#0b1026;}
#lobby .blue{background:#0369a1;color:#fff;} #lobby .pink{background:#be185d;color:#fff;}
#lobby .mini:disabled{opacity:.45;cursor:default;}
#lobby .skin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}
#lobby .skin{border-radius:14px;padding:14px 10px;text-align:center;border:2px solid rgba(255,255,255,.14);
  background:rgba(15,23,42,.8);}
#lobby .skin.equipped{border-color:#4ade80;}
#lobby .swatch{width:46px;height:46px;border-radius:50%;margin:0 auto 8px;border:3px solid rgba(255,255,255,.4);}
#lobby .skin b{font-size:14px;display:block;} #lobby .skin small{color:#94a3b8;font-size:11px;}
#lobby .skin .mini{margin-top:8px;}
#lobby .note{font-size:12px;color:#64748b;text-align:center;margin-top:12px;line-height:1.6;}
#lobby #lobby-back{margin-top:14px;width:100%;padding:11px;border-radius:12px;background:transparent;
  border:2px solid rgba(255,255,255,.25);color:#fff;font-weight:800;cursor:pointer;font-size:14px;}
#lobby-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:30;background:rgba(0,0,0,.85);
  border:1px solid #f472b6;color:#fff;font-weight:800;padding:10px 22px;border-radius:22px;display:none;font-size:14px;}
`;

export class Lobby {
  constructor(music) {
    this.music = music;
    this.onStart = null;
    this.heroId = 'george';
    this.playerName = 'George';
    this.ranked = false;
    this.squad = 'solo';
    this.tab = 'play';
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    this.root = document.createElement('div');
    this.root.id = 'lobby';
    this.root.innerHTML = '<div class="lobby-wrap" id="lobby-wrap"></div>';
    document.body.appendChild(this.root);
    this.toastEl = document.createElement('div');
    this.toastEl.id = 'lobby-toast';
    document.body.appendChild(this.toastEl);
    social.onChange = () => { if (this.root.classList.contains('open')) this.render(); };
  }

  open(heroId, playerName) {
    this.heroId = heroId; this.playerName = playerName;
    social.setName(playerName);
    this.tab = 'play';
    this.root.classList.add('open');
    this.music.start('menu');
    this.render();
  }
  close() { this.root.classList.remove('open'); }

  toast(msg, ms = 2200) {
    this.toastEl.textContent = msg;
    this.toastEl.style.display = 'block';
    clearTimeout(this._tt);
    this._tt = setTimeout(() => { this.toastEl.style.display = 'none'; }, ms);
  }

  render() {
    const d = social.data;
    const tier = social.tier(), next = social.nextTier();
    const h = HEROES[this.heroId];
    const pct = next ? Math.min(100, ((d.rp - tier.min) / (next.min - tier.min)) * 100) : 100;
    const badgeN = d.requestsIn.length + d.gifts.length;
    const w = document.getElementById('lobby-wrap');

    w.innerHTML = `
      <div class="prof">
        <div class="avatar" style="background:${h.css}">${d.name[0].toUpperCase()}</div>
        <div class="pinfo"><b>${d.name}</b> <span style="color:${h.css}">· ${h.name}</span>
          <div class="id">ID: ${d.id}</div></div>
        <div class="rankbox">
          <div>${tier.icon} ${tier.name} <span style="color:#94a3b8">· ${d.rp} RP</span></div>
          <div class="rankbar"><i style="width:${pct}%;background:${tier.color}"></i></div>
          <div class="coins">🪙 ${d.coins}</div>
        </div>
      </div>
      <div class="tabs">
        <div class="tab ${this.tab === 'play' ? 'sel' : ''}" data-tab="play">⚔️ PLAY</div>
        <div class="tab ${this.tab === 'friends' ? 'sel' : ''}" data-tab="friends">👥 FRIENDS${d.requestsIn.length ? `<span class="dot">${d.requestsIn.length}</span>` : ''}</div>
        <div class="tab ${this.tab === 'gifts' ? 'sel' : ''}" data-tab="gifts">🎁 GIFTS${d.gifts.length ? `<span class="dot">${d.gifts.length}</span>` : ''}</div>
        <div class="tab ${this.tab === 'skins' ? 'sel' : ''}" data-tab="skins">👕 SKINS</div>
      </div>
      <div class="pane ${this.tab === 'play' ? 'sel' : ''}" id="pane-play"></div>
      <div class="pane ${this.tab === 'friends' ? 'sel' : ''}" id="pane-friends"></div>
      <div class="pane ${this.tab === 'gifts' ? 'sel' : ''}" id="pane-gifts"></div>
      <div class="pane ${this.tab === 'skins' ? 'sel' : ''}" id="pane-skins"></div>
      <button id="lobby-back">← CHANGE HERO</button>
      <div class="note">Online squads across countries unlock with Phase-2 servers.<br/>Everything you earn now (rank, coins, skins) carries over. 💞</div>`;

    w.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { this.tab = t.dataset.tab; this.render(); }));
    document.getElementById('lobby-back').addEventListener('click', () => this.close());
    this._renderPlay(w);
    this._renderFriends(w);
    this._renderGifts(w);
    this._renderSkins(w);
  }

  _renderPlay(w) {
    const p = w.querySelector('#pane-play');
    p.innerHTML = `
      <div class="mode">
        <div class="modecard ${!this.ranked ? 'sel' : ''}" id="m-classic"><h3>⚔️ Classic</h3><p>Chill BR vs 9 bots<br/>+coins, small RP</p></div>
        <div class="modecard ${this.ranked ? 'sel' : ''}" id="m-ranked"><h3>🏆 Ranked</h3><p>Climb ${social.tier().icon} ${social.tier().name}<br/>big RP, careful losses</p></div>
      </div>
      <div class="squadopts">
        <div class="modecard ${this.squad === 'solo' ? 'sel' : ''}" id="s-solo"><h3>🎯 Solo</h3><p>You vs 9</p></div>
        <div class="modecard ${this.squad === 'duo' ? 'sel' : ''}" id="s-duo"><h3>💞 Duo + Mary</h3><p>Heartlink ult</p></div>
      </div>
      <button id="lobby-start">▶ START MATCH</button>`;
    document.getElementById('m-classic').addEventListener('click', () => { this.ranked = false; this.render(); });
    document.getElementById('m-ranked').addEventListener('click', () => { this.ranked = true; this.render(); });
    document.getElementById('s-solo').addEventListener('click', () => { this.squad = 'solo'; this.render(); });
    document.getElementById('s-duo').addEventListener('click', () => { this.squad = 'duo'; this.render(); });
    document.getElementById('lobby-start').addEventListener('click', () => {
      this.close();
      if (this.onStart) this.onStart({ ranked: this.ranked, squad: this.squad });
    });
  }

  _renderFriends(w) {
    const d = social.data;
    const p = w.querySelector('#pane-friends');
    const reqHtml = d.requestsIn.map((r, i) => `
      <div class="rowcard"><div class="grow"><b>${r.name}</b><small>${r.note} · wants to squad up</small></div>
        <button class="mini green" data-acc="${i}">Accept</button>
        <button class="mini red" data-dec="${i}">X</button></div>`).join('');
    const frHtml = d.friends.map((f) => `
      <div class="rowcard"><div class="grow"><b>${f.name}</b>
        <small>${f.note}</small><span class="${f.online ? 'online' : 'offline'}">${f.online ? '● online' : '○ offline'}</span></div>
        <button class="mini pink" data-gift="${f.id}">🎁 Gift</button></div>`).join('') || '<div class="note">No friends yet — add some below!</div>';
    const findHtml = social.findPlayers().map((f) => `
      <div class="rowcard"><div class="grow"><b>${f.name}</b><small>${f.note} · ${f.id}</small></div>
        <button class="mini blue" data-add="${f.name}">+ Add</button></div>`).join('');
    const outHtml = d.requestsOut.map((f) => `
      <div class="rowcard"><div class="grow"><b>${f.name}</b><small>Request sent… waiting ⏳</small></div></div>`).join('');
    p.innerHTML = `
      ${reqHtml ? '<b style="font-size:13px;color:#fbbf24">REQUESTS</b>' + reqHtml : ''}
      <b style="font-size:13px;color:#94a3b8">MY SQUAD (${d.friends.length})</b>${frHtml}${outHtml}
      <b style="font-size:13px;color:#94a3b8">FIND PLAYERS</b>${findHtml}
      <div class="note">Practice pals accept automatically. Real global friends arrive with Phase-2 servers.</div>`;
    p.querySelectorAll('[data-acc]').forEach((b) => b.addEventListener('click', () => {
      social.acceptRequest(+b.dataset.acc); this.toast('Friend added! 🎉 Check GIFTS…');
    }));
    p.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => social.declineRequest(+b.dataset.dec)));
    p.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => {
      const f = social.findPlayers().find((x) => x.name === b.dataset.add);
      if (f) { social.addFriend(f); this.toast(`Request sent to ${f.name} ✉️`); }
    }));
    p.querySelectorAll('[data-gift]').forEach((b) => b.addEventListener('click', () => {
      // Gift your equipped non-default skin, else 50 coins worth of love
      const owned = social.data.owned[this.heroId].filter((s) => s !== 'default');
      const f = social.data.friends.find((x) => x.id === b.dataset.gift);
      if (owned.length && f) {
        social.sendGift(f.id, this.heroId, owned[0]);
        this.toast(`Gifted ${HEROES[this.heroId].name} skin to ${f.name}! 💝`);
      } else this.toast('Equip a special skin first to gift it! (SKINS tab)');
    }));
  }

  _renderGifts(w) {
    const d = social.data;
    const p = w.querySelector('#pane-gifts');
    const today = new Date().toISOString().slice(0, 10);
    const gifts = d.gifts.map((g, i) => `
      <div class="rowcard"><div class="grow"><b>🎁 from ${g.from}</b><small>${g.text}</small></div>
        <button class="mini gold" data-claim="${i}">Claim</button></div>`).join('')
      || '<div class="note">No gifts right now. Win matches and pals will spoil you. 💝</div>';
    p.innerHTML = `
      <div class="rowcard"><div class="grow"><b>📦 Daily supply box</b>
        <small>${d.daily === today ? 'Claimed — come back tomorrow!' : 'Free 150 coins, every day'}</small></div>
        <button class="mini gold" id="daily-btn" ${d.daily === today ? 'disabled' : ''}>Claim</button></div>
      ${gifts}`;
    const db = document.getElementById('daily-btn');
    if (db) db.addEventListener('click', () => {
      if (social.claimDaily()) this.toast('Daily +150 coins! 🪙');
    });
    p.querySelectorAll('[data-claim]').forEach((b) => b.addEventListener('click', () => {
      const g = social.claimGift(+b.dataset.claim);
      if (g) this.toast(g.kind === 'skin' ? `New skin unlocked! Check SKINS 👕` : `+${g.amount} coins! 🪙`);
    }));
  }

  _renderSkins(w) {
    const p = w.querySelector('#pane-skins');
    const h = HEROES[this.heroId];
    const cards = SKINS[this.heroId].map((s) => {
      const owned = social.owns(this.heroId, s.id);
      const equipped = social.data.equipped[this.heroId] === s.id;
      const sw = s.palette ? '#' + s.palette.color.toString(16).padStart(6, '0') : h.css;
      let btn;
      if (equipped) btn = '<button class="mini green" disabled>Equipped ✓</button>';
      else if (owned) btn = `<button class="mini blue" data-equip="${s.id}">Equip</button>`;
      else if (s.giftOnly) btn = '<button class="mini red" disabled>🎁 Gift only</button>';
      else btn = `<button class="mini gold" data-buy="${s.id}">🪙 ${s.price}</button>`;
      return `<div class="skin ${equipped ? 'equipped' : ''}">
        <div class="swatch" style="background:${sw}"></div><b>${s.name}</b>
        <small>${h.name}</small><br/>${btn}</div>`;
    }).join('');
    p.innerHTML = `<div class="skin-grid">${cards}</div>
      <div class="note">Skins change your 3D outfit in-match. Gift-only skins come from friends &amp; events. 👕</div>`;
    p.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
      const s = SKINS[this.heroId].find((x) => x.id === b.dataset.buy);
      if (social.buySkin(this.heroId, s)) this.toast(`${s.name} unlocked! 👕`);
      else this.toast('Not enough coins — win matches! 🪙');
    }));
    p.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => {
      social.equipSkin(this.heroId, b.dataset.equip);
    }));
  }
}
