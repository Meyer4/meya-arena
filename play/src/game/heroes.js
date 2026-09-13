// Meya Arena — hero roster (single source of truth for the client).
// Phase 2: the server imports the mirror copy in /shared/heroDefinitions.js.
// NOTE: Kaito & Ember are ORIGINAL anime-inspired heroes (own names/designs/powers).

export const HEROES = {
  george: {
    id: 'george', name: 'George', title: 'The Bulwark', role: 'Tank · Vanguard',
    color: 0x22d3ee, accent: 0xf8fafc, skin: 0x8d5524, visor: 0x0ea5e9,
    css: '#22d3ee', glow: 'rgba(34,211,238,.35)',
    hp: 1250, speed: 7.2, atkDmg: 48, atkRange: 3.6, atkInterval: 0.7,
    ranged: false, regen: 0.022,
    bars: { hp: 100, atk: 65, spd: 45 },
    desc: 'An unbreakable guardian. Dives in, soaks damage, slams the earth itself.',
    skills: {
      s1:  { name: 'Shockwave',   icon: '💥', cd: 6,  dmg: 130, radius: 7, desc: 'Slam the ground: damage + knockback all around you.' },
      s2:  { name: 'Brave Dash',  icon: '🛡️', cd: 9,  dmg: 85,  desc: 'Dash forward with your shield. Damages enemies passed + 150 shield.' },
      ult: { name: 'Titan Slam',  icon: '☄️', cd: 30, dmg: 300, radius: 9, desc: 'Leap to an enemy and CRUSH the arena: huge damage + 1.5s stun.' },
    },
    passive: 'Bulwark: takes 15% less damage below 50% HP.',
  },
  mary: {
    id: 'mary', name: 'Mary', title: 'The Starlight', role: 'Ranger · Burst',
    color: 0xf472b6, accent: 0xfdf4ff, skin: 0xa0622d, visor: 0xec4899,
    css: '#f472b6', glow: 'rgba(244,114,182,.35)',
    hp: 850, speed: 8.2, atkDmg: 36, atkRange: 14, atkInterval: 0.55,
    ranged: true, regen: 0.022,
    bars: { hp: 55, atk: 90, spd: 85 },
    desc: 'A swift starlight ranger. Kites enemies and rains meteors from the sky.',
    skills: {
      s1:  { name: 'Piercing Shot', icon: '🌠', cd: 5,  dmg: 160, desc: 'A star bolt that pierces through every enemy in a line.' },
      s2:  { name: 'Phase Step',    icon: '✨', cd: 8,  desc: 'Blink forward. Your next attack within 4s deals +50%.' },
      ult: { name: 'Starfall',      icon: '💫', cd: 28, dmg: 95, desc: 'Call 8 meteors onto the nearest enemies. Pure sky wrath.' },
    },
    passive: 'Swiftstep: +10% speed for 2s after casting an ability.',
  },
  kaito: {
    id: 'kaito', name: 'Kaito', title: 'The Shadow Fang', role: 'Assassin · Ninja',
    color: 0x8b5cf6, accent: 0x1e1b4b, skin: 0x6b4226, visor: 0xc4b5fd,
    css: '#a78bfa', glow: 'rgba(139,92,246,.4)',
    hp: 950, speed: 8.8, atkDmg: 52, atkRange: 3.3, atkInterval: 0.6,
    ranged: false, regen: 0.02,
    bars: { hp: 62, atk: 95, spd: 100 },
    desc: 'A blur between shadows. Strikes twice before you blink — then he is gone.',
    skills: {
      s1:  { name: 'Fang Flurry',  icon: '🗡️', cd: 5,  dmg: 55, desc: 'Lunge + slash TWICE in an arc. Lightning opener.' },
      s2:  { name: 'Smoke Step',   icon: '💨', cd: 9,  dmg: 70, radius: 4, desc: 'Vanish and reappear 9m ahead: blast + speed surge.' },
      ult: { name: 'Shadow Hunt',  icon: '🌙', cd: 26, dmg: 200, desc: 'ULT: chain-teleport through up to 3 enemies, 200 each. The hunt never misses.' },
    },
    passive: 'Windrunner: fastest base speed in the Arena.',
  },
  ember: {
    id: 'ember', name: 'Ember', title: 'The Cinder Spirit', role: 'Mage · Burst',
    color: 0xfb923c, accent: 0x431407, skin: 0x7c3f16, visor: 0xfde047,
    css: '#fb923c', glow: 'rgba(251,146,60,.4)',
    hp: 800, speed: 7.6, atkDmg: 40, atkRange: 13, atkInterval: 0.6,
    ranged: true, regen: 0.02,
    bars: { hp: 52, atk: 100, spd: 70 },
    desc: 'A wildfire given form. Burns brightest against the wounded — finish them.',
    skills: {
      s1:  { name: 'Flame Lance',   icon: '🔥', cd: 6,  dmg: 175, desc: 'A piercing spear of fire through every enemy in a line.' },
      s2:  { name: 'Cinder Rush',   icon: '☄️', cd: 10, dmg: 120, radius: 5, desc: 'Blazing dash that detonates where you stop.' },
      ult: { name: 'Inferno Bloom', icon: '🌋', cd: 30, dmg: 330, radius: 7, desc: 'ULT: mark an enemy — the sky detonates under them. Devastating.' },
    },
    passive: 'Ignite: +12% damage to enemies below 50% HP.',
  },
};

// 💞 Signature mechanic: the Bond ultimate, usable in Duo when close together.
export const BOND = {
  name: 'Heartlink Overdrive', icon: '💞', cd: 45, range: 18,
  healPct: 0.4, dmg: 220, radius: 8.5,
  desc: 'Duo unite: heal 40%, shockwave both positions, +30% speed 5s.',
};

export const BOT_NAMES = ['Viper', 'Jax', 'Nova', 'Kito', 'Zara', 'Blaze', 'Onyx', 'Rogue', 'Sable', 'Echo'];
export const BOT_HEROES = ['george', 'mary', 'kaito', 'ember'];

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
};
