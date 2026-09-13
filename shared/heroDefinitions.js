// Meya Arena — CANONICAL hero definitions (server imports this in Phase 2).
// Single source of truth for stats/cooldowns prevents client/server desync.
// Client mirror: client/src/game/heroes.js (keep in sync).

export const HEROES = {
  george: {
    id: 'george', hp: 1250, speed: 7.2, atkDmg: 48, atkRange: 3.6, atkInterval: 0.7,
    ranged: false, regen: 0.022,
    skills: {
      s1:  { cd: 6,  dmg: 130, radius: 7 },
      s2:  { cd: 9,  dmg: 85, shield: 150, shieldDur: 3 },
      ult: { cd: 30, dmg: 300, radius: 9, stun: 1.5 },
    },
  },
  mary: {
    id: 'mary', hp: 850, speed: 8.2, atkDmg: 36, atkRange: 14, atkInterval: 0.55,
    ranged: true, regen: 0.022,
    skills: {
      s1:  { cd: 5,  dmg: 160 },
      s2:  { cd: 8,  blink: 12, empower: 1.5, empowerDur: 4 },
      ult: { cd: 28, dmg: 95, meteors: 8 },
    },
  },
};

export const BOND = { cd: 45, range: 18, healPct: 0.4, dmg: 220, radius: 8.5 };
