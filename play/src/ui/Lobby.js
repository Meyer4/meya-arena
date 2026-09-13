import { HEROES, SKINS } from '../game/heroes.js';
import { social } from '../social/Social.js';

const HERO_LIST = Object.values(HEROES);
const GFX_LEVELS = ['auto', 'low', 'medium', 'high'];

// Lobby: topbar, hero card, hero strip, mode/squad picks, friends/gifts/skins sheets.
export class Lobby {
  constructor({ game, hud, input, sfx, music, engine }) {
    this.game = game;
    this.hud = hud;
    this.input = input;
    this.sfx = sfx;
    this.music = music;
    this.engine = engine;
    this.mode = 'classic';
    this.squadMode = 'solo';
    this.hero = localStorage.getItem('meya-hero') || 'george';
    if (!HEROES[this.hero]) this.hero = 'george';
    this.gfxLevel = 'auto';
    this.cb = {};
    this._sheet = null;
    this.$ = (id) => document.getElementById(id);
  }

  on(evt, fn) { (this.cb[evt] = this.cb[evt] || []).push(fn); }
  emit(evt, data) { for (const fn of this.cb[evt] || []) fn(data); }

  init() {
    const $ = this.$;
    $('lb-name').value = social.data.name || 'George';
    $('lb-name').addEventListener('change', (e) => {
      const n = e.target.value.trim() || 'George';
      social.setName(n);
      this.refreshRankCoins();
    });

    // Hero strip chips.
    const strip = $('hero-strip');
    strip.innerHTML = '';
    for (const h of HERO_LIST) {
      const b = document.createElement('button');
      b.className = 'hero-chip' + (h.id === this.hero ? ' sel' : '');
      b.style.setProperty('--hc', h.css);
      b.style.setProperty('--hg', h.glow || h.css);
      b.innerHTML = `<div class="face" style="background:${h.css}"></div><b>${h.name}</b><span>${h.role.split(' ')[0]}</span>`;
      b.onclick = () => { this.sfx.click(); this.selectHero(h.id); };
      strip.appendChild(b);
      h._chip = b;
    }

    // Mode / squad picks.
    $('lb-mode-classic').onclick = () => { this.sfx.click(); this.setMode('classic'); };
    $('lb-mode-ranked').onclick = () => { this.sfx.click(); this.setMode('ranked'); };
    $('lb-squad-solo').onclick = () => { this.sfx.click(); this.setSquad('solo'); };
    $('lb-squad-duo').onclick = () => { this.sfx.click(); this.setSquad('duo'); };
    $('lb-start').onclick = () => {
      this.sfx.click();
      social.setName($('lb-name').value.trim() || 'George');
      this.emit('start', {
        heroId: this.hero, mode: this.mode, squadMode: this.squadMode,
        playerName: social.data.name,
      });
    };

    // Topbar buttons.
    $('lb-friends-btn').onclick = () => { this.sfx.click(); this.openFriends(); };
    $('lb-gifts-btn').onclick = () => { this.sfx.click(); this.openGifts(); };
    $('lb-skins-btn').onclick = () => { this.sfx.click(); this.openSkins(); };
    $('lb-mute-btn').onclick = () => this.toggleMute();
    $('lb-mute-btn').textContent = this.sfx.muted ? '🔇' : '🔊';
    const gfxBtn = $('lb-gfx-btn');
    gfxBtn.textContent = 'AUTO';
    gfxBtn.onclick = () => {
      this.sfx.click();
      const i = (GFX_LEVELS.indexOf(this.gfxLevel) + 1) % GFX_LEVELS.length;
      this.gfxLevel = GFX_LEVELS[i];
      this.engine.setQualityMode(this.gfxLevel);
      gfxBtn.textContent = this.gfxLevel.toUpperCase();
    };

    // Sheet close.
    $('sheet-close').onclick = () => this.closeSheet();
    $('sheet-backdrop').onclick = () => this.closeSheet();

    // Live updates for friend accept / gift arrivals.
    social.onChange = () => {
      this.refreshBadges();
      this.refreshRankCoins();
      if (this._sheet === 'FRIENDS') this.openFriends(true);
      else if (this._sheet === 'GIFTS') this.openGifts(true);
      else if (this._sheet === 'SKINS') this.openSkins(true);
    };
    this.refreshBadges();
    this.renderCard();
    this.refreshRankCoins();
  }

  toggleMute() {
    const m = this.sfx.toggleMute();
    this.music.setMuted(m);
    this.$('lb-mute-btn').textContent = m ? '🔇' : '🔊';
    if (this.hud && this.hud.e.mute) this.hud.e.mute.textContent = m ? '🔇' : '🔊';
  }

  show() {
    this.$('lobby-ui').classList.add('open');
    this.$('lb-mute-btn').textContent = this.sfx.muted ? '🔇' : '🔊';
    this.game.enterLobby(this.hero);
    this.refreshRankCoins();
    this.refreshBadges();
  }

  hide() {
    this.closeSheet();
    this.$('lobby-ui').classList.remove('open');
  }

  selectHero(id) {
    this.hero = id;
    localStorage.setItem('meya-hero', id);
    for (const h of HERO_LIST) if (h._chip) h._chip.classList.toggle('sel', h.id === id);
    this.renderCard();
    // Fast path: swap figure without rebuilding the stage.
    if (this.game.state === 'lobby' && this.game.lobbyGroup) this.game.setLobbyHero(id);
    else this.game.enterLobby(id);
  }

  setMode(m) {
    this.mode = m;
    this.$('lb-mode-classic').classList.toggle('sel', m === 'classic');
    this.$('lb-mode-ranked').classList.toggle('sel', m === 'ranked');
    this.$('lb-start-sub').textContent = `${m.toUpperCase()} · ${this.squadMode.toUpperCase()}`;
  }

  setSquad(s) {
    this.squadMode = s;
    this.$('lb-squad-solo').classList.toggle('sel', s === 'solo');
    this.$('lb-squad-duo').classList.toggle('sel', s === 'duo');
    this.$('lb-start-sub').textContent = `${this.mode.toUpperCase()} · ${s.toUpperCase()}`;
  }

  heroDef() { return HEROES[this.hero] || HEROES.george; }

  renderCard() {
    const h = this.heroDef();
    const card = this.$('lb-hero-card');
    card.style.setProperty('--hc', h.css);
    this.$('hero-name').innerHTML = `${h.name} <span>· ${h.title}</span>`;
    this.$('lb-hero-role').textContent = (h.role || '').toUpperCase();
    const kit = this.$('lb-hero-kit');
    kit.innerHTML = '';
    const rows = [
      ['ATK', h.ranged ? '🔫 Ranged bolts' : '🗡️ Melee strikes'],
      ['S1', `${h.skills.s1.icon} ${h.skills.s1.name}`],
      ['S2', `${h.skills.s2.icon} ${h.skills.s2.name}`],
      ['ULT', `${h.skills.ult.icon} ${h.skills.ult.name}`],
    ];
    for (const [k, v] of rows) {
      const li = document.createElement('li');
      li.innerHTML = `<b>${k}</b> · ${v}`;
      kit.appendChild(li);
    }
    const bars = this.$('lb-hero-bars');
    bars.innerHTML = '';
    for (const [label, v] of [['HP', h.bars.hp], ['ATK', h.bars.atk], ['SPD', h.bars.spd]]) {
      const d = document.createElement('div');
      d.className = 'lb-bar';
      d.innerHTML = `<label>${label}</label><div class="tr"><i style="width:${Math.round(v)}%"></i></div>`;
      bars.appendChild(d);
    }
  }

  refreshRankCoins() {
    const t = social.tier();
    this.$('lb-rank').textContent = `${t.icon} ${t.name}`;
    this.$('lb-coins').textContent = `🪙 ${social.data.coins}`;
    const av = this.$('lb-avatar');
    av.textContent = (social.data.name || 'G').charAt(0).toUpperCase();
    av.style.background = this.heroDef().css;
  }

  refreshBadges() {
    const fr = social.data.requestsIn.length;
    const gi = social.data.gifts.length;
    const fd = this.$('lb-friends-dot');
    const gd = this.$('lb-gifts-dot');
    fd.textContent = fr; fd.classList.toggle('on', fr > 0);
    gd.textContent = gi; gd.classList.toggle('on', gi > 0);
  }

  // ---------------- Sheets ----------------
  openSheet(title) {
    this.$('sheet-title').textContent = title;
    this.$('sheet-backdrop').classList.add('open');
    this.$('sheet').classList.add('open');
    this._sheet = title;
  }
  closeSheet() {
    this.$('sheet-backdrop').classList.remove('open');
    this.$('sheet').classList.remove('open');
    this._sheet = null;
  }

  openFriends(keep) {
    if (!keep) this.openSheet('FRIENDS');
    this.refreshBadges();
    const body = this.$('sheet-body');
    body.innerHTML = '';
    const sec = (title) => {
      const h = document.createElement('div');
      h.className = 'sec-h'; h.textContent = title;
      body.appendChild(h);
    };
    // Requests.
    sec('REQUESTS');
    if (!social.data.requestsIn.length) {
      const n = document.createElement('div');
      n.className = 'note'; n.textContent = 'No pending requests.';
      body.appendChild(n);
    }
    social.data.requestsIn.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'rowcard';
      row.innerHTML = `<div class="grow"><b>${f.name}</b><small>${f.note || 'Arena fighter ⚔️'}</small></div>`;
      const ok = document.createElement('button');
      ok.className = 'mini green'; ok.textContent = 'ACCEPT';
      ok.onclick = () => {
        const i = social.data.requestsIn.findIndex((x) => x.id === f.id);
        social.acceptRequest(i); this.sfx.click();
      };
      const no = document.createElement('button');
      no.className = 'mini red'; no.textContent = 'X';
      no.onclick = () => {
        const i = social.data.requestsIn.findIndex((x) => x.id === f.id);
        social.declineRequest(i); this.sfx.click();
      };
      row.appendChild(ok); row.appendChild(no);
      body.appendChild(row);
    });
    // Friends.
    sec('FRIENDS');
    if (!social.data.friends.length) {
      const n = document.createElement('div');
      n.className = 'note'; n.textContent = 'No friends yet — add fighters below.';
      body.appendChild(n);
    }
    const equippedId = social.data.equipped[this.hero];
    for (const f of social.data.friends) {
      const row = document.createElement('div');
      row.className = 'rowcard';
      row.innerHTML = `<div class="grow"><b>${f.name}</b><span class="${f.online ? 'online' : 'offline'}">${f.online ? '● online' : '○ offline'}</span></div>`;
      const gift = document.createElement('button');
      gift.className = 'mini pink'; gift.textContent = '🎁';
      gift.title = 'Gift your equipped skin';
      gift.disabled = !equippedId || equippedId === 'default';
      gift.onclick = () => {
        if (social.sendGift(f.id, this.hero, equippedId)) {
          this.sfx.bond();
          this.openFriends(true);
        }
      };
      const rm = document.createElement('button');
      rm.className = 'mini red'; rm.textContent = 'X'; rm.title = 'Remove';
      rm.onclick = () => { social.removeFriend(f.id); };
      row.appendChild(gift); row.appendChild(rm);
      body.appendChild(row);
    }
    // Find players.
    sec('FIND FIGHTERS');
    for (const p of social.findPlayers()) {
      const row = document.createElement('div');
      row.className = 'rowcard';
      row.innerHTML = `<div class="grow"><b>${p.name}</b><small>${p.note}</small></div>`;
      const add = document.createElement('button');
      const pending = social.data.requestsOut.some((x) => x.name === p.name);
      add.className = 'mini blue'; add.textContent = pending ? 'SENT' : 'ADD';
      add.disabled = pending;
      add.onclick = () => { social.addFriend(p); this.sfx.click(); };
      row.appendChild(add);
      body.appendChild(row);
    }
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = 'New friends accept in seconds and send a thank-you gift. Gifting them a skin earns coins back.';
    body.appendChild(note);
  }

  openGifts(keep) {
    if (!keep) this.openSheet('GIFTS');
    this.refreshBadges();
    const body = this.$('sheet-body');
    body.innerHTML = '';
    // Daily bonus.
    const daily = document.createElement('div');
    daily.className = 'rowcard';
    daily.innerHTML = `<div class="grow"><b>🎁 Daily bonus</b><small>Free coins once per day</small></div>`;
    const db = document.createElement('button');
    db.className = 'mini gold'; db.textContent = 'CLAIM 150';
    db.onclick = () => {
      const got = social.claimDaily();
      this.sfx.click();
      if (got > 0) this.hud.toast('+150 daily coins! 🪙');
      else this.hud.toast('Come back tomorrow! 🎁');
    };
    daily.appendChild(db);
    body.appendChild(daily);
    const h = document.createElement('div');
    h.className = 'sec-h'; h.textContent = `INBOX (${social.data.gifts.length})`;
    body.appendChild(h);
    if (!social.data.gifts.length) {
      const n = document.createElement('div');
      n.className = 'note'; n.textContent = 'No gifts. Friends send coins and skins — check back soon.';
      body.appendChild(n);
      return;
    }
    social.data.gifts.forEach((g) => {
      const label = g.kind === 'coins' ? `🎁 ${g.amount} coins` : `👕 ${g.skinId} (${g.heroId})`;
      const row = document.createElement('div');
      row.className = 'rowcard';
      row.innerHTML = `<div class="grow"><b>${label}</b><small>from ${g.from} — ${g.text || ''}</small></div>`;
      const claim = document.createElement('button');
      claim.className = 'mini gold'; claim.textContent = 'CLAIM';
      claim.onclick = () => {
        const i = social.data.gifts.findIndex((x) => x.from === g.from && x.text === g.text);
        const got = social.claimGift(i);
        this.sfx.click();
        if (got && got.kind === 'skin') {
          social.equipSkin(got.heroId, got.skinId);
          this.hud.toast(`New skin: ${got.skinId}! 👕`);
        }
      };
      row.appendChild(claim);
      body.appendChild(row);
    });
  }

  openSkins(keep) {
    if (!keep) this.openSheet('SKINS');
    const body = this.$('sheet-body');
    body.innerHTML = '';
    for (const h of HERO_LIST) {
      const hh = document.createElement('div');
      hh.className = 'sec-h'; hh.textContent = h.name.toUpperCase();
      body.appendChild(hh);
      const grid = document.createElement('div');
      grid.className = 'skin-grid';
      const equipped = social.data.equipped[h.id];
      for (const sk of (SKINS[h.id] || [])) {
        const has = social.owns(h.id, sk.id);
        const eq = equipped === sk.id;
        const d = document.createElement('div');
        d.className = 'skin' + (eq ? ' equipped' : '');
        d.innerHTML = `<div class="swatch" style="background:${sk.css || h.css}"></div><b>${sk.name}</b>`;
        const b = document.createElement('button');
        if (eq) { b.className = 'mini green'; b.textContent = 'ON'; b.disabled = true; }
        else if (has) {
          b.className = 'mini blue'; b.textContent = 'EQUIP';
          b.onclick = () => {
            this.sfx.click();
            social.equipSkin(h.id, sk.id);
            if (h.id === this.hero) {
              if (this.game.state === 'lobby' && this.game.lobbyGroup) this.game.setLobbyHero(h.id);
              else this.game.enterLobby(this.hero);
            }
          };
        } else if (sk.giftOnly) {
          b.className = 'mini red'; b.textContent = '🎁 GIFT'; b.disabled = true;
        } else {
          b.className = 'mini gold'; b.textContent = `🪙${sk.price}`;
          b.disabled = social.data.coins < sk.price;
          b.onclick = () => {
            if (social.buySkin(h.id, sk)) {
              this.sfx.bond();
              if (h.id === this.hero) {
                if (this.game.state === 'lobby' && this.game.lobbyGroup) this.game.setLobbyHero(h.id);
                else this.game.enterLobby(this.hero);
              }
            } else this.sfx.click();
          };
        }
        d.appendChild(b);
        grid.appendChild(d);
      }
      body.appendChild(grid);
    }
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = 'Earn coins by fighting and claiming gifts. 🎁 skins come from friends. Buying auto-equips.';
    body.appendChild(note);
  }
}
