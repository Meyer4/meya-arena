# Meya Arena — Phase 2 Plan (hosting, safety, ranked, online)

## 1. Hosting (free stack)
| Piece | Where | Cost | Notes |
|---|---|---|---|
| Website + game client | **GitHub Pages** | Free | Static hosting. Repo root `index.html` (from `site/`), game in `/play/` (from `client/`). Update site links to `./play/index.html`. |
| Quick test alt | Netlify Drop | Free | Drag `client/` folder → instant URL. |
| Match server | **Render.com** Web Service | Free tier | Needs always-on process for WebSockets. `server/` → GitHub → Render auto-deploy. Sleeps after 15min idle on free tier (first match of the day waits ~40s). |
| Auth/friends/db | Firebase | Free tier | Google account → Console → Auth (Google + anon) + Firestore → apply `firebase/firestore.rules`. |
| APK | PWABuilder.com | Free | Point at hosted game URL → Android package. |

## 2. Google Play Protect — stay clean ✅
Sideloaded APKs ALWAYS show "install unknown app?" — normal, not a virus flag.
To never look like malware:
1. **Sign with YOUR OWN keystore** (PWABuilder lets you upload one; back it up!).
   Keep the same key + package name (`com.meya.arena`) for every update.
2. **Zero dangerous permissions.** This game needs: INTERNET only. No contacts/SMS/location.
   (PWABuilder manifest requests none of those — don't add any.)
3. **Add a privacy policy** page on the site + link it in the store listing.
4. **Real trust path ($25 once):** Google Play Console → upload App Bundle →
   Internal Testing track → share test link. Play-signed builds = no warnings.
5. Never: crypto miners, aggressive ad SDKs, fake "system update" prompts.

## 3. Ranked design (live locally NOW, global on server deploy)
- Tiers: Bronze 0 · Silver 400 · Gold 800 · Platinum 1200 · Diamond 1600 · Mythic 2200.
- Local RP (Social.awardMatch): placement + kills + win bonus; ranked losses can dip.
- Server mirror: `ratings` map + MMR matchmaking window in `server/src/index.js`.
- Season reset (Phase 2.2): soft reset to Gold cap, rewards = exclusive skins.
- Anti-smurf: ranked unlocks after 5 classic matches (add flag in Social).

## 4. Client netcode (seams already marked in Game.js)
1. `net/SocketClient.js`: connect Render URL, hello → queue → match → snaps.
2. `net/ClientPrediction.js`: run local sim instantly on input (already the Phase-1 path).
3. `net/ServerReconciliation.js`: correct vs server snapshots by input seq.
4. `net/EntityInterpolation.js`: smooth remote players (150–250ms buffer).
5. Firebase adapter for Social.js: same method names, Firestore backend.

## 5. Content rules — anime-style WITHOUT lawsuits
Kaito & Ember are ORIGINAL (own names, designs, powers). Never ship:
real anime names, exact costume copies, or copied signature moves by name.
"Fast shadow ninja with chain-dash" = fine. "Uchiha Sharingan" = takedown.
Future collab-like drops: keep the 3-skin pattern (default / coins / gift-only).

## 6. Costs summary
Everything above is **$0** except optional Play Console ($25 one-time) and
optional custom domain (~$12/yr). Render free-tier sleep is the only real
limitation — $7/mo fixes it when you have daily players.
