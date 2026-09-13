// Meya Arena — Social.js
// Profile, coins, ranked RP, friends, requests, gifts, skins.
// LOCAL adapter (localStorage) works fully offline NOW; the method signatures
// match the Phase-2 Firebase adapter, so going online = swap, not rewrite.

const KEY = 'meya-social-v1';
const PAL_ID = () => 'MEA-' + Math.random().toString(36).slice(2, 6).toUpperCase();

export const RANKS = [
  { min: 0,    name: 'Bronze',   icon: '🥉', color: '#d97706' },
  { min: 400,  name: 'Silver',   icon: '🥈', color: '#94a3b8' },
  { min: 800,  name: 'Gold',     icon: '🥇', color: '#fbbf24' },
  { min: 1200, name: 'Platinum', icon: '💠', color: '#67e8f9' },
  { min: 1600, name: 'Diamond',  icon: '💎', color: '#818cf8' },
  { min: 2200, name: 'Mythic',   icon: '🔥', color: '#f472b6' },
];

const DEMO_PALS = [
  { id: 'MEA-MARY', name: 'Mary', note: 'Starlight duo 💞' },
  { id: 'MEA-ZARA', name: 'Zara', note: 'Loves gifting skins' },
  { id: 'MEA-KITO', name: 'Kito', note: 'Ranked grinder' },
];
const FIND_POOL = ['Viper', 'Nova', 'Blaze', 'Onyx', 'Jax', 'Rogue', 'Sable', 'Echo'];

class SocialService {
  constructor() {
    this.data = this._load();
    this.onChange = null; // lobby subscribes
  }

  _load() {
    const fresh = () => ({
      id: PAL_ID(), name: 'George', coins: 300, rp: 0,
      owned: { george: ['default'], mary: ['default'], kaito: ['default'], ember: ['default'], raptor: ['default'], bram: ['default'], luna: ['default'], rook: ['default'] },
      equipped: { george: 'default', mary: 'default', kaito: 'default', ember: 'default', raptor: 'default', bram: 'default', luna: 'default', rook: 'default' },
      friends: [
        { id: 'MEA-MARY', name: 'Mary', online: true, note: 'Starlight duo 💞' },
        { id: 'MEA-ZARA', name: 'Zara', online: false, note: 'Loves gifting skins' },
      ],
      requestsIn: [{ id: 'MEA-KITO', name: 'Kito', note: 'Ranked grinder' }],
      requestsOut: [],
      gifts: [{ from: 'Mary', kind: 'coins', amount: 150, text: 'Welcome to the Arena! 💞' }],
      daily: '',
      giftedWelcome: false,
    });
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        // Migrate older saves (e.g. v1.0 without kaito/ember) instead of crashing.
        const d = JSON.parse(raw), f = fresh();
        d.owned = { ...f.owned, ...(d.owned || {}) };
        d.equipped = { ...f.equipped, ...(d.equipped || {}) };
        for (const k of ['friends', 'requestsIn', 'requestsOut', 'gifts']) {
          if (!Array.isArray(d[k])) d[k] = f[k];
        }
        if (typeof d.coins !== 'number') d.coins = f.coins;
        if (typeof d.rp !== 'number') d.rp = f.rp;
        if (!d.id) d.id = f.id;
        return d;
      }
    } catch (_) { /* fresh start */ }
    return fresh();
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (_) { /* ignore */ }
    if (this.onChange) this.onChange();
  }

  setName(n) { this.data.name = n; this.save(); }

  // ---------- Ranked ----------
  tier() {
    let t = RANKS[0];
    for (const r of RANKS) if (this.data.rp >= r.min) t = r;
    return t;
  }
  nextTier() {
    for (const r of RANKS) if (r.min > this.data.rp) return r;
    return null;
  }
  // Called at match end. Returns { rp, coins } deltas for the end screen.
  awardMatch({ win, placement, kills, ranked }) {
    let rp, coins = 50 + kills * 15 + (win ? 100 : 0);
    if (ranked) {
      rp = (10 - placement) * 9 + kills * 7 + (win ? 40 : 0);
      if (!win && placement > 6) rp = -12;      // small sting for bad ranked loss
      coins += 25;
    } else {
      rp = Math.max(2, (10 - placement) * 3 + kills * 2);
    }
    this.data.rp = Math.max(0, this.data.rp + rp);
    this.data.coins += coins;
    this.save();
    return { rp, coins };
  }

  // ---------- Skins ----------
  owns(heroId, skinId) { return (this.data.owned[heroId] || []).includes(skinId); }
  buySkin(heroId, skin) {
    if (this.owns(heroId, skin.id) || this.data.coins < skin.price) return false;
    this.data.coins -= skin.price;
    this.data.owned[heroId].push(skin.id);
    this.data.equipped[heroId] = skin.id;
    this.save();
    return true;
  }
  equipSkin(heroId, skinId) {
    if (!this.owns(heroId, skinId)) return false;
    this.data.equipped[heroId] = skinId;
    this.save();
    return true;
  }
  grantSkin(heroId, skinId) {
    if (!this.owns(heroId, skinId)) { this.data.owned[heroId].push(skinId); this.save(); }
  }
  // Palette override for the 3D mesh. Null = default hero colors.
  getEquippedPalette(heroId, skinsCatalog) {
    const eq = this.data.equipped[heroId];
    if (!eq || eq === 'default') return null;
    const list = skinsCatalog[heroId] || [];
    const s = list.find((x) => x.id === eq);
    return s ? s.palette : null;
  }

  // ---------- Friends ----------
  findPlayers() {
    const known = new Set([...this.data.friends, ...this.data.requestsIn, ...this.data.requestsOut].map((f) => f.name));
    return FIND_POOL.filter((n) => !known.has(n)).slice(0, 4)
      .map((name, i) => ({ id: 'MEA-' + name.slice(0, 4).toUpperCase() + i, name, note: 'Arena fighter ⚔️' }));
  }
  addFriend(p) {
    if (this.data.friends.some((f) => f.name === p.name)) return;
    if (this.data.requestsOut.some((f) => f.name === p.name)) return;
    this.data.requestsOut.push(p);
    this.save();
    // Demo: pals accept shortly after (Phase 2: real push via Firebase).
    setTimeout(() => {
      this.data.requestsOut = this.data.requestsOut.filter((f) => f.name !== p.name);
      this.data.friends.push({ ...p, online: Math.random() < 0.6 });
      this.data.gifts.push({ from: p.name, kind: 'coins', amount: 60, text: `Thanks for adding me! — ${p.name}` });
      this.save();
    }, 4000);
  }
  acceptRequest(i) {
    const r = this.data.requestsIn[i];
    if (!r) return;
    this.data.requestsIn.splice(i, 1);
    this.data.friends.push({ ...r, online: true });
    // Zara-style welcome: first accepted friend gifts a skin
    if (!this.data.giftedWelcome) {
      this.data.giftedWelcome = true;
      this.data.gifts.push({ from: r.name, kind: 'skin', heroId: 'mary', skinId: 'rose',
        text: `${r.name} gifted you ROSE QUEEN Mary! 🌹` });
    }
    this.save();
  }
  declineRequest(i) { this.data.requestsIn.splice(i, 1); this.save(); }
  removeFriend(id) { this.data.friends = this.data.friends.filter((f) => f.id !== id); this.save(); }

  // ---------- Gifts ----------
  claimGift(i) {
    const g = this.data.gifts[i];
    if (!g) return null;
    this.data.gifts.splice(i, 1);
    if (g.kind === 'coins') this.data.coins += g.amount;
    else if (g.kind === 'skin') this.grantSkin(g.heroId, g.skinId);
    this.save();
    return g;
  }
  claimDaily() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.daily === today) return 0;
    this.data.daily = today;
    this.data.coins += 150;
    this.save();
    return 150;
  }
  // Send a gift to a friend (Phase 1: friend auto-thanks you with coins back).
  sendGift(friendId, heroId, skinId) {
    const f = this.data.friends.find((x) => x.id === friendId);
    if (!f || !this.owns(heroId, skinId)) return false;
    this.save();
    setTimeout(() => {
      this.data.gifts.push({ from: f.name, kind: 'coins', amount: 80,
        text: `${f.name} loved your gift and sent thanks! 💝` });
      this.save();
    }, 5000);
    return true;
  }
}

export const social = new SocialService();
