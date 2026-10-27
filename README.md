# NEMCO College Student Simulator (PWA)

3D open-world college life simulator (Three.js r128, vendored locally in `js/three.min.js`).
Works offline after the first load and can be installed on Android / desktop.

## Controls
| Desktop | Mobile |
|---|---|
| WASD / arrows move · Shift run · Space jump | Left joystick · RUN toggle · JUMP |
| E interact · Q drop ball · H horn | E button (interact) |
| J missions · I inventory · Tab status · F friends · P / Esc pause | top-right menu buttons, bag button |
| Mouse look (click to capture) | Drag on the right side to look |
Driving the tricycle: W/S gas & brake, A/D steer, Space handbrake, E exit (mobile: GAS / BRAKE / horn / EXIT buttons).

## Deploy to GitHub Pages
1. Create a repository (e.g. `nemco-simulator`) and upload **the contents of this folder** (so `index.html` is at the repo root).
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
3. Wait ~1 minute. The game is at `https://<username>.github.io/<repo>/`.
4. Everything uses relative paths (`./service-worker.js`, `start_url: ./index.html`, scope `./`), so project sub-paths work without changes.
5. **Updating:** edit files, then bump `VERSION` in `service-worker.js` (e.g. `v5.0.1`). Players get an "Update" toast and the new cache replaces the old one.

## Install on Android
1. Open the GitHub Pages URL in **Chrome** (HTTPS is required).
2. Tap **📲 INSTALL APP** on the title screen (or Chrome menu ⋮ → *Install app* / *Add to Home screen*).
3. Launch "NEMCO Simulator" from the home screen: it opens fullscreen/landscape and works offline.
iPhone/iPad: Safari → Share → *Add to Home Screen*.

## Offline / caching
`service-worker.js` precaches every game file (versioned cache `nemco-sim-<VERSION>`), never caches failed or cross-origin responses, falls back to `offline.html` when needed, and removes old caches on activation. Save data lives in `localStorage` and is never touched by updates.

## Files
`index.html`, `css/style.css`, `js/*.js` (gfx, base, audio, state, world, interior, npc, missions, vehicle, ui, game, pwa), `manifest.webmanifest`, `service-worker.js`, `offline.html`, `icons/`.

## Local testing
`python3 -m http.server 8000` in this folder, then open `http://localhost:8000` (service workers work on localhost).
