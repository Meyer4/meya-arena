// Meya Arena — client-side constants (Phase 1).
// NOTE: keep in sync with /shared/constants.js (canonical copy used by the
// Phase-2 server). They are duplicated so the client folder deploys standalone.

export const VERSION = '1.0.0-phase1';
export const TICK_RATE = 20;          // server sim tick (Phase 2 authoritative)
export const MAP_RADIUS = 60;         // playable arena radius (world units)
export const CAM_DIST = 11;           // third-person camera distance
export const GRAVITY = 22;

// Quality tier order for the Adaptive Performance Engine
export const TIERS = ['low', 'medium', 'high'];

export const TIER_SETTINGS = {
  high:   { pixelRatioCap: 2.0, shadows: true,  shadowSize: 2048, particleMul: 1.0 },
  medium: { pixelRatioCap: 1.5, shadows: true,  shadowSize: 1024, particleMul: 0.7 },
  low:    { pixelRatioCap: 1.0, shadows: false, shadowSize: 512,  particleMul: 0.4 },
};
