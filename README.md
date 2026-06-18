# ChaosTracker26

A simple, installable battle tracker for **Warriors of Chaos** in *Warhammer: The Old World*.
Paste/import your Old World Builder army and, in real time, keep on top of the table admin:

- **Live stat lines** — every unit's effective profile recomputes instantly from its
  base stats + Mark of Chaos + Gaze of the Gods rewards + magic items + active spells +
  casualties. Improved characteristics show green ▲, worsened ones red ▼, with the original
  value beneath. Characteristics cap at 10.
- **Mounts** folded the Old World way — a ridden monster's `(+N)` stats add to the rider
  (e.g. Chaos Dragon gives +1 T, +6 W) and the model moves at the mount's Movement; the
  mount's own profile is shown for reference.
- **Champions & command** — a condensed champion line shows only the champion's differing
  stats; chips show Standard / Musician / Battle Standard / General.
- **Gaze of the Gods** (characters with the rule) — roll a D6 or pick a result; lasting
  rewards stay for the battle, temporary ones clear on your next turn. Table is editable.
- **Spells & lores** — Battle Magic, Daemonology, Dark Magic and the Lore of the Shadowlands
  plus the Mark signature spells, or generic augment/hex building blocks and custom effects.
  Stat-changing spells update the unit live; instant Magic Missiles just flash a reminder.
- **Gifts, magic items & chaotic traits** — a full library; effects with a clean stat change
  apply live, others show as a reminder. Imported wargear auto-links to its effect.
- **Wounds & casualties** — model and wound steppers (tap the number to set it exactly),
  with ½-strength, Fleeing and Destroyed badges and a per-army summary.
- **Turn tracker** — advance the turn to clear non-permanent additions in one tap.
- **Multiple armies** — keep several lists, switch between them, import each as its own army.
- **Backup / Restore** to a JSON file, **collapsible** unit cards, and clickable special-rule
  links to tow.whfb.app.
- **Works offline** and installs to your phone home screen (PWA). Everything is saved
  locally on your device — use **Backup to file** to move it between devices.

> ⚔️ **Stat lines and the Gaze of the Gods table are sensible *editable defaults*** so the
> app is useful out of the box. Tap **✎ Edit** on a unit (or **Edit table** in the Gaze
> dialog) and verify against your own rulebook — your edits are saved.

## Importing your army

In Old World Builder, **Export your list as JSON** and save the `.owb.json` file. In the
app tap **Import list → Choose .owb.json file**. The importer reads unit sizes, Marks,
mounts, command, magic items and special rules automatically. You can also paste the JSON
text, or a plain-text list, into the box. Anything it doesn't recognise stays fully editable.

## Running it

It's a static site — no build step, no server needed.

- **Quick try:** open `index.html` in a browser. (Offline caching/install need HTTPS, below.)
- **Install on your phone (recommended):** host it on **GitHub Pages** and open the URL on
  your phone, then *Add to Home Screen*.

### Deploy to Render (recommended for phone use)

This repo includes a `render.yaml` Blueprint, so deploying is one flow:

1. Push this repo to GitHub (any branch Render can see — the feature branch is fine;
   you don't need to merge to `main`).
2. In the [Render dashboard](https://dashboard.render.com): **New ▸ Blueprint**, connect
   this repository, and pick the branch. Render reads `render.yaml` and creates a free
   **Static Site** (no build step, automatic HTTPS).
3. Click **Apply**. After it builds you'll get a URL like
   `https://chaostracker26.onrender.com`.
4. Open that URL on your phone → browser menu → **Add to Home Screen**. Because it's served
   over HTTPS, the app installs and works offline.

Prefer not to use a Blueprint? Create the service by hand: **New ▸ Static Site**, connect the
repo, set **Build Command** to empty (or `echo ok`) and **Publish Directory** to `.` (the repo
root). Every push to the chosen branch then auto-deploys.

### Deploy to GitHub Pages (alternative)

This repo includes a workflow at `.github/workflows/deploy-pages.yml`. In your repo settings
go to **Settings → Pages → Build and deployment → Source: GitHub Actions**. Pushing to the
default branch then publishes the app; the workflow can also be run manually. Your app will
be served at `https://<user>.github.io/<repo>/`.

## Project layout

```
index.html              app shell
styles.css              dark, mobile-first theme
js/data.js              unit stat defaults, marks, Gaze table, spell library (all editable)
js/parser.js            Old World Builder importer (JSON + text fallback)
js/app.js               state, live stat calculation, UI
manifest.webmanifest    PWA manifest
service-worker.js       offline cache
scripts/make-icons.mjs  regenerate the app icons (node scripts/make-icons.mjs)
```

## Notes

- This is an unofficial fan-made tool. Warhammer: The Old World and Warriors of Chaos are
  © Games Workshop. No rulebook text is reproduced here — effects are described in plain,
  generic mechanical terms, and game values are provided as editable defaults you confirm.
