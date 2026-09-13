# MEYA ARENA — Third-Person Ability Battle Royale

Free-to-play arena battler starring **George**, **Mary**, **Kaito** and **Ember**.
Made for Mary. **v1.1 "Heartlink"**

## Play right now (this workspace)
One live preview is running — open it, then:
- `site/` → the website (live gameplay runs behind the hero section)
- `client/` → the playable game (menu → lobby → match)
- `client/?demo=1` → silent auto-playing showcase match
- Mobile: left joystick · drag right side to look · tap abilities
- PC: WASD + mouse (click game first) · Space/click · Q/E/R · T bond

## Feature set
- Third-person BR combat: 10 fighters, shrinking zone, last standing wins
- 4 heroes with full kits (2 skills + ult), all playable by bots
- Duo combo ultimate: Heartlink Overdrive
- Ranked ladder (Bronze → Mythic) + coins economy
- Lobby: friends, requests, gifts, daily box, 3D skins
- Original synthesized music (menu + battle), full SFX
- Adaptive Performance Engine (auto quality, holds frames on budget phones)
- PWA: manifest, icons, service worker (offline + installable)

## Publish (your accounts, my checklists)
1. **Links → GitHub Pages** (free): `site/*` to repo root, `client/*` to `/play/`.
2. **APK → PWABuilder.com**: paste game URL → Package for Android → back up signing key.
3. **Trust → Play Console** ($25 once): upload .aab to Internal testing.
4. **Online → Render + Firebase** (free tiers) for global multiplayer.
Full guides: `docs/PHASE2-PLAN.md` (hosting/safety/ranked) and
`docs/STORE-LISTING.md` (copy/paste store texts + click paths).

## Project map
- `client/` — game (PWA-ready; net seams marked PHASE2)
- `site/` — website + privacy policy
- `server/` — match server v0.2 (MMR queue + rooms + ranked store)
- `shared/` — canonical constants + hero stats
- `firebase/` — Firestore rules
- `docs/` — architecture, phase-2 plan, store listing kit
