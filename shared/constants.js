// Meya Arena — CANONICAL shared constants (imported by server in Phase 2).
// The client keeps a copy at client/src/core/constants.js so the client folder
// deploys standalone. Keep both in sync until a build step is added.

export const VERSION = '1.0.0-phase1';
export const TICK_RATE = 20;
export const MAP_RADIUS = 60;
export const CAM_DIST = 11;
export const GRAVITY = 22;

export const TIERS = ['low', 'medium', 'high'];
export const TIER_SETTINGS = {
  high:   { pixelRatioCap: 2.0, shadows: true,  shadowSize: 2048, particleMul: 1.0 },
  medium: { pixelRatioCap: 1.5, shadows: true,  shadowSize: 1024, particleMul: 0.7 },
  low:    { pixelRatioCap: 1.0, shadows: false, shadowSize: 512,  particleMul: 0.4 },
};
