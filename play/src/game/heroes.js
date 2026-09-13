// Meya Arena — hero roster: 8 heroes (single source of truth for the client).
// Phase 2: the server imports the mirror copy in /shared/heroDefinitions.js.

export const HEROES = {
  george: {
    id: 'george', name: 'George', title: 'The Bulwark', role: 'Tank · Vanguard',
    color: 0x22d3ee, accent: 0xf8fafc, skin: 0x8d5524, visor: 0x0ea5e9,
    css: '#22d3ee', glow: 'rgba(34,211,238,.35)',
    hp: 1250, speed: 7.2, atkDmg: 48, atkRange: 3.6, atkInterval: 0.7,
    ranged: false, regen: 0.022,
    bars: { hp: 100, atk: 65, spd: 45 },
    desc: 'Unbreakable frontline. Dives in, soaks damage, slams the earth itself.',
    skills: {
      s1:  { name: 'Shockwave',   icon: '💥', cd: 6,  dmg: 130, radius: 7, desc: 'AoE slam + knockback.' },
      s2:  { name: 'Brave Dash',  icon: '🛡️', cd: 9,  dmg: 85,  desc: 'Shield dash + 150 barrier.' },
      ult: { name: 'Titan Slam',  icon: '☄️', cd: 30, dmg: 300, radius: 9, desc: 'Leap in: huge damage + stun.' },
    },
    passive: 'Bulwark: -15% damage below 50% HP.',
  },
  mary: {
    id: 'mary', name: 'Mary', title: 'The Starlight', role: 'Ranger · Burst',
    color: 0xf472b6, accent: 0xfdf4ff, skin: 0xa0622d, visor: 0xec4899,
    css: '#f472b6', glow: 'rgba(244,114,182,.35)',
    hp: 850, speed: 8.2, atkDmg: 36, atkRange: 14, atkInterval: 0.55,
    ranged: true, regen: 0.022,
    bars: { hp: 55, atk: 90, spd: 85 },
    desc: 'Swift skirmisher. Kites danger and answers with the sky.',
    skills: {
      s1:  { name: 'Piercing Shot', icon: '🌠', cd: 5,  dmg: 160, desc: 'Bolt through a whole line.' },
      s2:  { name: 'Phase Step',    icon: '✨', cd: 8,  desc: 'Blink + empowered shot.' },
      ult: { name: 'Starfall',      icon: '💫', cd: 28, dmg: 95, desc: '8-meteor barrage.' },
    },
    passive: 'Swiftstep: +10% speed after casting.',
  },
  kaito: {
    id: 'kaito', name: 'Kaito', title: 'The Shadow Fang', role: 'Assassin · Ninja',
    color: 0x8b5cf6, accent: 0x1e1b4b, skin: 0x6b4226, visor: 0xc4b5fd,
    css: '#a78bfa', glow: 'rgba(139,92,246,.4)',
    hp: 950, speed: 8.8, atkDmg: 52, atkRange: 3.3, atkInterval: 0.6,
    ranged: false, regen: 0.02,
    bars: { hp: 62, atk: 95, spd: 100 },
    desc: 'A blur between shadows. Strikes twice before you blink.',
    skills: {
      s1:  { name: 'Fang Flurry',  icon: '🗡️', cd: 5,  dmg: 55, desc: 'Lunge + double slash.' },
      s2:  { name: 'Smoke Step',   icon: '💨', cd: 9,  dmg: 70, radius: 4, desc: 'Vanish + blast + haste.' },
      ult: { name: 'Shadow Hunt',  icon: '🌙', cd: 26, dmg: 200, desc: 'Chain through 3 enemies.' },
    },
    passive: 'Windrunner: fastest base speed.',
  },
  ember: {
    id: 'ember', name: 'Ember', title: 'The Cinder Spirit', role: 'Mage · Burst',
    color: 0xfb923c, accent: 0x431407, skin: 0x7c3f16, visor: 0xfde047,
    css: '#fb923c', glow: 'rgba(251,146,60,.4)',
    hp: 800, speed: 7.6, atkDmg: 40, atkRange: 13, atkInterval: 0.6,
    ranged: true, regen: 0.02,
    bars: { hp: 52, atk: 100, spd: 70 },
    desc: 'Wildfire given form. Burns brightest against the wounded.',
    skills: {
      s1:  { name: 'Flame Lance',   icon: '🔥', cd: 6,  dmg: 175, desc: 'Piercing fire spear.' },
      s2:  { name: 'Cinder Rush',   icon: '☄️', cd: 10, dmg: 120, radius: 5, desc: 'Dash that detonates.' },
      ult: { name: 'Inferno Bloom', icon: '🌋', cd: 30, dmg: 330, radius: 7, desc: 'Delayed sky nuke + stun.' },
    },
    passive: 'Ignite: +12% damage to wounded.',
  },
  raptor: {
    id: 'raptor', name: 'Raptor', title: 'The Deadeye', role: 'Sniper · Precision',
    color: 0x84cc16, accent: 0x1a2e05, skin: 0x6b4226, visor: 0xecfccb,
    css: '#a3e635', glow: 'rgba(132,204,22,.4)',
    hp: 780, speed: 7.4, atkDmg: 46, atkRange: 16, atkInterval: 0.8,
    ranged: true, regen: 0.02,
    bars: { hp: 50, atk: 98, spd: 68 },
    desc: 'One shot, one lesson. Deletes targets before they get close.',
    skills: {
      s1:  { name: 'Deadeye Round', icon: '🎯', cd: 7,  dmg: 190, desc: 'Long piercing rail shot.' },
      s2:  { name: 'Ghost Dash',    icon: '💨', cd: 10, dmg: 0, desc: 'Quick reposition + haste.' },
      ult: { name: 'Railspike',     icon: '⚡', cd: 30, dmg: 380, desc: 'Devastating full-line nuke.' },
    },
    passive: 'Eagle Eye: longest attack range.',
  },
  bram: {
    id: 'bram', name: 'Bram', title: 'The Breaker', role: 'Brawler · Juggernaut',
    color: 0x92400e, accent: 0x44403c, skin: 0x8d5524, visor: 0xfbbf24,
    css: '#d97706', glow: 'rgba(217,119,6,.4)',
    hp: 1350, speed: 7.0, atkDmg: 55, atkRange: 3.4, atkInterval: 0.8,
    ranged: false, regen: 0.024,
    bars: { hp: 100, atk: 80, spd: 40 },
    desc: 'A walking earthquake. Gets close, and it is already over.',
    skills: {
      s1:  { name: 'Uppercut',   icon: '👊', cd: 6,  dmg: 120, desc: 'Arc slam + stun.' },
      s2:  { name: 'Bull Charge', icon: '🐂', cd: 10, dmg: 100, desc: 'Charge + 100 barrier.' },
      ult: { name: 'Earthquake', icon: '🌍', cd: 30, dmg: 130, desc: 'Triple shockwave + stuns.' },
    },
    passive: 'Juggernaut: highest health pool.',
  },
  luna: {
    id: 'luna', name: 'Luna', title: 'The Frostcaller', role: 'Mage · Control',
    color: 0x7dd3fc, accent: 0xf0f9ff, skin: 0xd9a066, visor: 0x0ea5e9,
    css: '#7dd3fc', glow: 'rgba(125,211,252,.4)',
    hp: 820, speed: 7.5, atkDmg: 38, atkRange: 12, atkInterval: 0.6,
    ranged: true, regen: 0.02,
    bars: { hp: 54, atk: 82, spd: 72 },
    desc: 'The cold never misses. Freezes the fight, then shatters it.',
    skills: {
      s1:  { name: 'Frostbolt',  icon: '❄️', cd: 5,  dmg: 120, desc: 'Unerring bolt + freeze.' },
      s2:  { name: 'Frost Nova', icon: '🧊', cd: 11, dmg: 90, radius: 6, desc: 'AoE blast + deep freeze.' },
      ult: { name: 'Blizzard',   icon: '🌨️', cd: 30, dmg: 80, desc: 'Storm ticks + freezes.' },
    },
    passive: 'Permafrost: abilities freeze targets.',
  },
  rook: {
    id: 'rook', name: 'Rook', title: 'The Warden', role: 'Support · Guardian',
    color: 0x34d399, accent: 0xfefce8, skin: 0x7c4a21, visor: 0xa7f3d0,
    css: '#34d399', glow: 'rgba(52,211,153,.4)',
    hp: 900, speed: 7.6, atkDmg: 34, atkRange: 11, atkInterval: 0.6,
    ranged: true, regen: 0.02,
    bars: { hp: 60, atk: 55, spd: 72 },
    desc: 'The squad survives because Rook says so. Heals, shields, saves.',
    skills: {
      s1:  { name: 'Mend Pulse', icon: '💚', cd: 8,  dmg: 0, desc: 'Heal self + nearby ally.' },
      s2:  { name: 'Aegis',      icon: '🛡️', cd: 12, dmg: 0, desc: 'Barrier self + nearby ally.' },
      ult: { name: 'Sanctuary',  icon: '✚', cd: 32, dmg: 0, desc: 'Massive heal + cleanse.' },
    },
    passive: 'Guardian: +20% healing to allies.',
  },
};

export const BOND = {
  name: 'Heartlink Overdrive', icon: '💞', cd: 45, range: 18,
  healPct: 0.4, dmg: 220, radius: 8.5,
  desc: 'Duo unite: heal 40%, shockwave both positions, +30% speed 5s.',
};

export const BOT_NAMES = ['Viper', 'Jax', 'Nova', 'Kito', 'Zara', 'Blaze', 'Onyx', 'Rogue', 'Sable', 'Echo', 'Fang', 'Drift'];
export const BOT_HEROES = ['george', 'mary', 'kaito', 'ember', 'raptor', 'bram', 'luna', 'rook'];

// ---- Skins: palette swaps (no downloads, instant). giftOnly = from gifts. ----
export const SKINS = {
  george: [
    { id: 'default', name: 'Guardian Blue', price: 0, palette: null },
    { id: 'crimson', name: 'Crimson Warden', price: 600, css: '#ef4444',
      palette: { color: 0xef4444, accent: 0x1c1917, visor: 0xfca5a5 } },
    { id: 'abyss', name: 'Abyssal Knight', price: 0, giftOnly: true, css: '#22d3ee',
      palette: { color: 0x0e7490, accent: 0x0b1026, visor: 0x67e8f9 } },
  ],
  mary: [
    { id: 'default', name: 'Starlight Pink', price: 0, palette: null },
    { id: 'neon', name: 'Neon Idol', price: 600, css: '#e879f9',
      palette: { color: 0xe879f9, accent: 0x111827, visor: 0xfdf4ff } },
    { id: 'rose', name: 'Rose Queen', price: 0, giftOnly: true, css: '#fb7185',
      palette: { color: 0xe11d48, accent: 0xfff7ed, visor: 0xfda4af } },
  ],
  kaito: [
    { id: 'default', name: 'Shadow Violet', price: 0, palette: null },
    { id: 'storm', name: 'Storm Fang', price: 600, css: '#38bdf8',
      palette: { color: 0x0284c7, accent: 0xf8fafc, visor: 0xbae6fd } },
    { id: 'oni', name: 'Oni Shade', price: 0, giftOnly: true, css: '#ef4444',
      palette: { color: 0x7f1d1d, accent: 0x000000, visor: 0xfbbf24 } },
  ],
  ember: [
    { id: 'default', name: 'Cinder Orange', price: 0, palette: null },
    { id: 'solar', name: 'Solar Flare', price: 600, css: '#fde047',
      palette: { color: 0xfacc15, accent: 0x713f12, visor: 0xffffff } },
    { id: 'void', name: 'Voidfire', price: 0, giftOnly: true, css: '#a78bfa',
      palette: { color: 0x6d28d9, accent: 0x0b1026, visor: 0xf0abfc } },
  ],
  raptor: [
    { id: 'default', name: 'Scout Green', price: 0, palette: null },
    { id: 'venom', name: 'Venom Strike', price: 600, css: '#4d7c0f',
      palette: { color: 0x3f6212, accent: 0x101a05, visor: 0xd9f99d } },
    { id: 'phantom', name: 'Phantom', price: 0, giftOnly: true, css: '#e2e8f0',
      palette: { color: 0xcbd5e1, accent: 0x0f172a, visor: 0x22d3ee } },
  ],
  bram: [
    { id: 'default', name: 'Breaker Bronze', price: 0, palette: null },
    { id: 'iron', name: 'Iron Breaker', price: 600, css: '#94a3b8',
      palette: { color: 0x64748b, accent: 0x1c1917, visor: 0xe2e8f0 } },
    { id: 'warlord', name: 'Warlord', price: 0, giftOnly: true, css: '#ef4444',
      palette: { color: 0x991b1b, accent: 0x000000, visor: 0xfbbf24 } },
  ],
  luna: [
    { id: 'default', name: 'Frost Blue', price: 0, palette: null },
    { id: 'glacier', name: 'Glacier', price: 600, css: '#0284c7',
      palette: { color: 0x0369a1, accent: 0xf0f9ff, visor: 0xbae6fd } },
    { id: 'aurora', name: 'Aurora', price: 0, giftOnly: true, css: '#5eead4',
      palette: { color: 0x2dd4bf, accent: 0x831843, visor: 0xf0abfc } },
  ],
  rook: [
    { id: 'default', name: 'Warden Green', price: 0, palette: null },
    { id: 'sentinel', name: 'Sentinel', price: 600, css: '#fbbf24',
      palette: { color: 0xd97706, accent: 0xfffbeb, visor: 0x166534 } },
    { id: 'saint', name: 'Saint', price: 0, giftOnly: true, css: '#fefce8',
      palette: { color: 0xfef9c3, accent: 0x713f12, visor: 0x4ade80 } },
  ],
};
