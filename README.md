# VORTEX STRIKERS

Desktop / mobile-friendly vertical shooter (Phaser 3 + Vite + TypeScript). Fixed logical size **720×1280**, scaled with `FIT`. With **prefers-reduced-motion: reduce**, camera shake, boss screen flash, and the title hint pulse are toned down or disabled.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production bundle → dist/
npm run preview  # serve dist/
```

**GitHub Pages** (project site `https://<user>.github.io/game1945/`): run `npm run build:gh-pages` so asset paths use base `/game1945/`. If the repo name differs, change `VITE_BASE` in `package.json` or run `VITE_BASE=/repo/ vite build` once after `tsc --noEmit`.

**CI:** pushing to `main` or `cursor/phaser-mvp-scaffold` runs `.github/workflows/deploy-pages.yml` (`build:gh-pages` + upload). Enable **Settings → Pages → Build and deployment → GitHub Actions** once per repository.

## Controls

| Key | Action |
|-----|--------|
| Move | WASD / arrows |
| Fire | Space |
| Charge shot | Hold / release X |
| Bomb | B |
| Pause | P or on-screen **PAUSE** (top-right) |
| SFX mute | V (preference saved in this browser) |
| Title — difficulty | H toggles Normal / Hard (saved locally; faster spawns & enemy fire) |
| Ship select | 1 / 2 or tap craft · **ESC** or **← Title** — back |

**High score:** best run score is saved in `localStorage` for this browser and shown on the title screen. Beating it shows **New best score!** on stage clear, game over, or demo complete.

**Leaderboard:** top **5** scores with **difficulty** and date/time from **game over** and **demo complete** only — title screen “TOP RUNS”. Older saves without difficulty migrate as Normal.

**Touch (in-game):** drag a finger on the playfield to move (auto-fire while dragging). Top-right **PAUSE**; when paused, tap **RESUME** (or press P). Lower corners: hold **CHARGE**, tap **BOMB**. Touch steering uses the first finger only until you lift it, so you can bomb with another finger. Title: tap anywhere to continue (same as ENTER).

**Result:** Enter — next · T — title · **NEXT** / **TITLE** buttons. **Game over:** Enter / T / tap — title. **Demo clear:** Enter / R · **TITLE** / **NEW RUN** buttons.

Debug shortcuts in **Game** only: R / G / M jump to Result / GameOver / MVP Clear; T — title.

### Deployed site shows console errors (e.g. `FetchError`, `content.js`, `Mapify`)

Those lines usually come from **browser extensions**, not this repo (extensions inject `content.js` into every page). Try a **private/incognito window with extensions disabled**, or another browser, and reload. The **favicon** is served as `favicon.svg` from `public/` so `/favicon.ico` 404 should stop after redeploy.
