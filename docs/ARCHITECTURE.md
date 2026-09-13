# Meya Arena — Architecture

> Free Fire third-person view × Mobile Legends abilities. Built for George & Mary 💞

## Phase 1 (SHIPPED — this folder, playable now)
Local simulation vs smart bots. No server needed.

```
client/
├── index.html                  # UI shell: menu, HUD, end screen (all inline CSS)
├── manifest.json                # PWA manifest (APK via PWABuilder)
├── icon-192.png / icon-512.png  # generated app icons
└── src/
    ├── main.js                  # boot + menu wiring + main loop
    ├── core/
    │   ├── Engine.js            # renderer/scene/camera + Adaptive Performance Engine
    │   ├── InputManager.js      # touch joystick + drag-look + WASD/mouse
    │   └── constants.js         # client copy (mirror of /shared)
    ├── game/
    │   ├── Game.js              # sim: combat, bots AI, zone, FX pools, Bond
    │   └── heroes.js            # roster source of truth (client copy)
    ├── ui/HUD.js                # HP, cooldowns, minimap, killfeed, dmg numbers
    └── audio/SFX.js             # synthesized WebAudio SFX (zero files)
```

## Phase 2 (NEXT — online multiplayer)
1. `server/` full build: RoomManager, MatchRoom, Queue, SquadMatcher,
   GameState, SimulationTick @20Hz, AbilityResolver, ZoneController, InputValidator.
2. Client `net/`: SocketClient, ClientPrediction, ServerReconciliation,
   EntityInterpolation. `Game.js` already marks the seam (`castSkill` = send-input-only).
3. Firebase: Auth + Firestore (friends, profiles) via `firebase/` rules + `FriendsGateway`.
4. Deploy: client → Netlify Drop · server → Render · APK → PWABuilder.

## Networking model (as blueprinted)
Prediction → server reconciliation → entity interpolation; clients send *inputs*,
never results. Damage/zone/deaths are server-authoritative with anti-cheat validation.

## Why it doesn't lag (Adaptive Performance Engine)
- Auto FPS monitor steps High/Medium/Lite (pixel ratio, shadows, particles).
- Pooled projectiles/particles/rings/damage-numbers: zero per-frame allocation.
- Stylized flat-shaded art: ~200 cheap draw calls, no post-processing, no textures.
- All SFX synthesized; all heroes built from primitives (no .glb downloads).
