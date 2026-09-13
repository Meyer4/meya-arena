# Meya Arena — Store Listing Kit (copy/paste for publishing)

## App identity (use everywhere, never change after first release)
- Package / Bundle ID: `com.meya.arena`
- App name: **Meya Arena**
- Category: Action (Google Play) / Games > Action (web stores)
- Content rating target: **Everyone 10+** (stylized fantasy combat, no blood realism, no chat with strangers in v1.x)
- Price: Free, no ads, no in-app purchases (v1.x)

## Short description (80 chars, Play Store)
> Third-person ability battle royale. 4 heroes, duo ults, ranked ladder.

## Full description (Play Store / PWABuilder)
> Meya Arena is a free third-person ability battle royale for mobile and PC.
>
> Drop into the arena with 9 fighters and be the last one standing when the
> zone closes. Every hero ships a full ability kit — two skills and a
> match-swinging ultimate: dashes, blinks, meteor storms and sky-fire nukes.
>
> • 4 free heroes: George the Bulwark, Mary the Starlight, Kaito the Shadow
>   Fang, Ember the Cinder Spirit
> • Duo combo ultimate: team up and detonate Heartlink Overdrive together
> • Ranked ladder from Bronze to Mythic, plus Classic quick play
> • Full lobby: friends, gifts, daily rewards and 3D outfit skins
> • Original soundtrack synthesized in-engine — zero downloads
> • Adaptive performance engine: smooth frames on flagships and budget phones
>
> No account needed. About 3 MB. Internet requested only to load the game
> engine on first launch — matches run on your device.

## Promo / feature-graphic text (1024x500, make in Canva)
Line 1: MEYA ARENA
Line 2: Third-person combat. Legendary abilities.

## Screenshots (take from the live game, landscape 16:9, min 2)
1. Hero select menu (shows all 4 heroes)
2. Mid-match combat with abilities visible
3. Victory screen
4. Lobby with ranked badge
Capture on PC preview at 1280x720 (landscape). No mockups needed — real gameplay.

## Privacy policy URL (required by Play Console)
`https://YOUR-DOMAIN/privacy.html` (file ready: `site/privacy.html`)

## Publishing click-path (phone-friendly)
### A. Permanent links (GitHub Pages, free)
1. Create GitHub account → New repository `meya-arena` (public).
2. Upload: everything from `site/` into repo root; everything from `client/`
   into repo folder `play/`. (Site auto-detects `./play/index.html`.)
3. Repo Settings → Pages → Deploy from branch → main → /(root) → Save.
4. Your links: `https://YOU.github.io/meya-arena/` (site),
   `https://YOU.github.io/meya-arena/play/` (game).

### B. APK (PWABuilder, free, ~10 min)
1. Open PWABuilder.com → paste your GAME url (`.../play/`).
2. Fix any warnings (manifest + icons + service worker are already in place).
3. Package for Android → **download signing key** on first run and BACK IT UP
   (same key + same package `com.meya.arena` for every future update).
4. Upload `meya-arena.apk` next to the site as `meya-arena.apk` — the
   Download button on the site already points at `./meya-arena.apk`.

### C. Google Play (trusted installs, $25 once)
1. Play Console → create account ($25 one-time) → Create app → fill listing
   from this file → upload the PWABuilder **.aab** (not APK) → Internal
   testing track → share the test link. Promote to production when ready.

## Pre-flight checklist
- [ ] Game loads from the PUBLIC url (not just local preview)
- [ ] Site "Play in browser" opens the game (no white screen)
- [ ] manifest.json + both icons + sw.js served over HTTPS
- [ ] Privacy policy live at /privacy.html
- [ ] Signing key backed up in 2 places
- [ ] Package name com.meya.arena on every build
