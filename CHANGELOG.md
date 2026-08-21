# Changelog

Versioning: from **1.0** onward, each release bumps the `x` in `1.x` by one.
The same notes appear in the app under **What's new** (next to the version in the footer).

## v1.4 — 2026-08-21
- Scoring: per-turn objectives now work turn-by-turn — tap **YOU/THEM** to mark who
  holds it this turn; pressing **Next ▶** banks that turn's points and clears the
  selection for the new turn, while past turns stay locked in.
- Fixed a stray "null" that showed above the secondaries, and the "secondarys" typo.

## v1.3 — 2026-08-21
- Scoring: fixed the summary totals (games / record / VP / tournament points) so
  the numbers sit in a tidy grid and are no longer cramped after the larger UI.

## v1.2 — 2026-08-21
- Scoring: bigger, higher-contrast "large touch" styling throughout — chunkier
  buttons, larger numbers and text, and more spacing for easy tapping on a phone.

## v1.1 — 2026-08-21
- Scoring: redesigned secondary objectives for mobile — each is now its own block
  with the name & VP as a header on top and big **YOU / THEM** buttons underneath
  (bigger, easier tap targets). Per-turn objectives tap to add (with an undo);
  one-off objectives toggle on/off.

## v1.0 — 2026-08-21
First versioned release. Consolidates all development so far.

- Live table tracker for **Warhammer: The Old World** — installable (PWA), works offline.
- **Three factions**, auto-detected from your Old World Builder import and self-themed:
  Warriors of Chaos, The Empire, High Elf Realms — full rosters, mounts, lores and magic items.
- **Import** army lists from Old World Builder (`.owb.json`).
- **Per-unit tracking:** live profile, wounds, casualties, mounts folded into the rider,
  special-rule tags, armour/ward saves.
- **Eye of the Gods** (Gaze of the Gods) rewards for Chaos, plus the "Call Daddy" roller.
- **Spells & effects:** per-lore spell menus and building-block buffs/hexes; the turn button
  clears temporary effects and shows start-of-turn reminders.
- **Status tracking** (fleeing / fled / dead) and a VP-loss summary.
- **Multiple armies**, backup & restore to file.
- **Scoring tab:** tournament sheet with the Warfare 2026 VP-difference → 20-point system
  (and Win/Draw/Loss scales), per-game cards, live record/VP summary, copy-to-clipboard results.
- **Matched Play Guide** missions dropdown and secondary objectives with correct VP —
  per-turn objectives tap each turn, one-off objectives use a tick; objectives are opt-in per
  game and secondary VP is editable.
- **In-game battle-turn stepper** so the Scoring tab works on its own.
- **Full opponent army list.**
- **Auto-updates** with a tap-to-refresh bar, plus a manual "Check for updates".

<!--
Template for the next release — copy, fill in, and bump APP_VERSION + the CACHE + the
CHANGELOG array in js/app.js to match.

## v1.1 — YYYY-MM-DD
- ...
-->
