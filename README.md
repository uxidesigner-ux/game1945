# VORTEX STRIKERS

Desktop / mobile-friendly vertical shooter (Phaser 3 + Vite + TypeScript). Fixed logical size **720×1280**, scaled with `FIT`.

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
| Ship select | 1 / 2 or click craft |

**Touch (in-game):** drag a finger on the playfield to move (auto-fire while dragging). Top-right **PAUSE**; when paused, tap **RESUME** (or press P). Lower corners: hold **CHARGE**, tap **BOMB**. Touch steering uses the first finger only until you lift it, so you can bomb with another finger. Title: tap anywhere to continue (same as ENTER).

**Result:** Enter — next stage · T — title. **Game over:** Enter / T — title. **Demo clear:** Enter — title · R — ship select.

Debug shortcuts in **Game** only: R / G / M jump to Result / GameOver / MVP Clear; T — title.
