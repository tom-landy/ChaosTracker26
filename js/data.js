/*
 * ChaosTracker26 — default game data for Warhammer: The Old World, Warriors of Chaos.
 *
 * IMPORTANT: every value here is an EDITABLE DEFAULT. Stat lines are best-effort
 * starting points so the app is useful immediately; verify them against your own
 * Arcane Journal / rulebook and tweak any unit in the app. Nothing here is copied
 * verbatim from a rulebook — effects are described in plain mechanical terms.
 */
(function () {
  "use strict";

  // The nine classic profile characteristics, in display order, plus saves.
  const STATS = ["M", "WS", "BS", "S", "T", "W", "I", "A", "Ld"];

  // Helper to build a profile object.
  function p(M, WS, BS, S, T, W, I, A, Ld, extra) {
    return Object.assign({ M, WS, BS, S, T, W, I, A, Ld, Sv: null, Ward: null }, extra || {});
  }

  // --- Unit / character stat defaults (keyed by normalised name) -------------
  // category: Characters | Core | Special | Rare. isChar marks single-model heroes.
  const UNITS = [
    // Characters
    { name: "Chaos Lord", category: "Characters", isChar: true, profile: p(4, 8, 5, 5, 5, 3, 7, 4, 9, { Sv: 4 }) },
    { name: "Exalted Hero", category: "Characters", isChar: true, profile: p(4, 7, 4, 5, 5, 2, 6, 3, 8, { Sv: 4 }) },
    { name: "Exalted Champion", category: "Characters", isChar: true, profile: p(4, 7, 4, 5, 5, 2, 6, 3, 8, { Sv: 4 }) },
    { name: "Sorcerer Lord", category: "Characters", isChar: true, profile: p(4, 5, 4, 4, 5, 3, 5, 2, 9), wizard: 3 },
    { name: "Chaos Sorcerer", category: "Characters", isChar: true, profile: p(4, 4, 3, 4, 4, 2, 4, 1, 8), wizard: 1 },
    { name: "Daemon Prince", category: "Characters", isChar: true, profile: p(6, 8, 5, 6, 6, 5, 8, 5, 9, { Sv: 4, Ward: 5 }) },

    // Core
    { name: "Chaos Warriors", category: "Core", profile: p(4, 5, 3, 4, 4, 1, 5, 1, 8, { Sv: 4 }), champ: "Champion of Chaos" },
    { name: "Chaos Marauders", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 6), champ: "Chieftain" },
    { name: "Marauder Horsemen", category: "Core", profile: p(8, 3, 3, 3, 3, 1, 3, 1, 6, { Sv: 6 }), champ: "Chieftain" },
    { name: "Chaos Warhounds", category: "Core", profile: p(9, 3, 0, 3, 3, 1, 3, 1, 5) },
    { name: "Chaos Chariot", category: "Core", isChar: false, profile: p(8, 0, 0, 5, 5, 4, 0, 0, 8, { Sv: 4 }), monster: true },

    // Special
    { name: "Chaos Knights", category: "Special", profile: p(8, 5, 3, 4, 4, 1, 5, 1, 8, { Sv: 2 }), champ: "Doom Knight" },
    { name: "Chaos Chosen", category: "Special", profile: p(4, 5, 3, 4, 4, 1, 5, 2, 8, { Sv: 4 }), champ: "Chosen Champion" },
    { name: "Chaos Ogres", category: "Special", profile: p(6, 3, 2, 4, 4, 3, 2, 3, 7, { Sv: 5 }), champ: "Ogre Champion" },
    { name: "Forsaken", category: "Special", profile: p(4, 4, 0, 4, 4, 1, 4, 1, 8) },
    { name: "Dragon Ogres", category: "Special", profile: p(7, 4, 3, 5, 5, 4, 3, 4, 8, { Sv: 4 }), champ: "Shartak" },

    // Rare
    { name: "Chaos Trolls", category: "Rare", profile: p(6, 3, 1, 5, 4, 3, 1, 3, 4), note: "Regeneration, Stupidity" },
    { name: "Chaos Spawn", category: "Rare", profile: p(4, 3, 0, 4, 5, 4, 1, 0, 10), note: "Random Attacks (D6+1), Random Movement" },
    { name: "Chaos Giant", category: "Rare", isChar: false, profile: p(6, 3, 3, 6, 5, 6, 3, 0, 10), monster: true, note: "Special attacks" },
    { name: "Chaos Warshrine", category: "Rare", isChar: false, profile: p(4, 3, 0, 5, 6, 5, 1, 3, 8, { Sv: 4 }), monster: true },
    { name: "Hellcannon", category: "Rare", isChar: false, profile: p(6, 3, 3, 6, 6, 5, 1, 4, 7, { Sv: 4 }), monster: true, note: "War machine / monster" },
  ];

  // Build a quick lookup by several normalised aliases.
  function norm(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  const UNIT_INDEX = {};
  for (const u of UNITS) {
    UNIT_INDEX[norm(u.name)] = u;
    // singular alias e.g. "Chaos Warrior" -> "Chaos Warriors"
    UNIT_INDEX[norm(u.name).replace(/s$/, "")] = u;
  }

  // --- Mounts (editable defaults) --------------------------------------------
  // A mounted character is one model, but rider and mount have separate profiles
  // and the mount adds its own Attacks and wounds. Tracked as a secondary line.
  const MOUNTS = [
    { name: "Chaos Steed", profile: p(8, 3, 0, 4, 4, 1, 3, 1, 5), note: "Barded" },
    { name: "Daemonic Mount", profile: p(8, 4, 0, 4, 4, 1, 4, 2, 7) },
    { name: "Chaos Dragon", profile: p(6, 6, 0, 6, 6, 6, 3, 4, 8), note: "Fly, Terror, Large Target, Breath Weapon" },
    { name: "Manticore", profile: p(6, 5, 0, 5, 5, 4, 5, 4, 5), note: "Fly, Terror, Large Target" },
    { name: "Chaos Chariot", profile: p(8, 0, 0, 5, 5, 4, 0, 0, 0), note: "Chariot — crew & steeds attack separately" },
    { name: "Gorebeast Chariot", profile: p(7, 0, 0, 5, 6, 5, 0, 0, 0), note: "Chariot" },
  ];
  const MOUNT_INDEX = {};
  for (const m of MOUNTS) { MOUNT_INDEX[norm(m.name)] = m; MOUNT_INDEX[norm(m.name).replace(/s$/, "")] = m; }

  // --- Marks of Chaos ---------------------------------------------------------
  // mods are numeric profile adjustments; rules are descriptive tags.
  const MARKS = {
    khorne: { name: "Mark of Khorne", mods: { A: 1 }, rules: ["Frenzy"] },
    nurgle: { name: "Mark of Nurgle", mods: {}, rules: ["Enemies in base contact suffer -1 To Hit"] },
    slaanesh: { name: "Mark of Slaanesh", mods: {}, rules: ["Immune to Psychology"] },
    tzeentch: { name: "Mark of Tzeentch", mods: { Ward: 6 }, rules: ["6+ Ward save (Tzeentch)"] },
    undivided: { name: "Mark of Undivided", mods: {}, rules: ["May re-roll on the Gaze of the Gods table"] },
  };

  // --- Gaze of the Gods table -------------------------------------------------
  // Rolled on a D6 in the Command sub-phase; the result affects the character,
  // not their mount. "temp" results last only until your next turn (cleared by
  // End of turn); the rest last the remainder of the battle. Characteristics cap
  // at 10. Values are editable in-app.
  const GAZE_REWARDS = [
    { id: "damned", roll: "1", name: "Damned by Chaos", mods: {}, rules: ["Subject to Stupidity for the rest of the game (if already Stupid, -1 Ld instead, min 2)"], bad: true },
    { id: "quick", roll: "2", name: "Unnatural Quickness", mods: { I: 1 }, temp: true, rules: [] },
    { id: "ironskin", roll: "3", name: "Iron Skin", mods: { T: 1 }, temp: true, rules: [] },
    { id: "mutation", roll: "4", name: "Murderous Mutation", mods: { WS: 1 }, rules: [] },
    { id: "fury", roll: "5", name: "Dark Fury", mods: { A: 1 }, rules: [] },
    { id: "apotheosis", roll: "6", name: "Apotheosis", mods: { S: 1, Ld: 1 }, rules: [] },
  ];

  // --- Spell / effect library -------------------------------------------------
  // Generic, reusable buff/debuff building blocks. duration is a default tag.
  // kind: augment (good, on your own unit) | hex (bad, on enemy/your unit).
  const SPELL_EFFECTS = [
    // Augments
    { id: "aug-s", kind: "augment", name: "+1 Strength", mods: { S: 1 } },
    { id: "aug-t", kind: "augment", name: "+1 Toughness", mods: { T: 1 } },
    { id: "aug-a", kind: "augment", name: "+1 Attack", mods: { A: 1 } },
    { id: "aug-ws", kind: "augment", name: "+1 Weapon Skill", mods: { WS: 1 } },
    { id: "aug-m", kind: "augment", name: "+1 Movement", mods: { M: 1 } },
    { id: "aug-hit", kind: "augment", name: "+1 To Hit", mods: {}, rules: ["+1 To Hit"] },
    { id: "aug-wound", kind: "augment", name: "+1 To Wound", mods: {}, rules: ["+1 To Wound"] },
    { id: "aug-rrhit", kind: "augment", name: "Re-roll To Hit", mods: {}, rules: ["Re-roll failed To Hit"] },
    { id: "aug-regen", kind: "augment", name: "Regeneration (5+)", mods: {}, rules: ["Regeneration (5+)"] },
    { id: "aug-ward", kind: "augment", name: "Ward save (5+)", mods: { Ward: 5 } },
    { id: "aug-frenzy", kind: "augment", name: "Frenzy (+1A)", mods: { A: 1 }, rules: ["Frenzy"] },
    { id: "aug-itp", kind: "augment", name: "Immune to Psychology", mods: {}, rules: ["Immune to Psychology"] },
    { id: "aug-flaming", kind: "augment", name: "Flaming Attacks", mods: {}, rules: ["Flaming Attacks"] },
    { id: "aug-magic", kind: "augment", name: "Magical Attacks", mods: {}, rules: ["Magical Attacks"] },
    // Hexes
    { id: "hex-s", kind: "hex", name: "-1 Strength", mods: { S: -1 } },
    { id: "hex-t", kind: "hex", name: "-1 Toughness", mods: { T: -1 } },
    { id: "hex-a", kind: "hex", name: "-1 Attack", mods: { A: -1 } },
    { id: "hex-ws", kind: "hex", name: "-1 Weapon Skill", mods: { WS: -1 } },
    { id: "hex-m", kind: "hex", name: "-1 Movement", mods: { M: -1 } },
    { id: "hex-hit", kind: "hex", name: "-1 To Hit", mods: {}, rules: ["-1 To Hit"] },
    { id: "hex-wound", kind: "hex", name: "-1 To Wound", mods: {}, rules: ["-1 To Wound"] },
    { id: "hex-ld", kind: "hex", name: "-1 Leadership", mods: { Ld: -1 } },
    { id: "hex-noarmour", kind: "hex", name: "No Armour Save", mods: {}, rules: ["No Armour Save allowed"] },
    { id: "hex-strikelast", kind: "hex", name: "Strikes Last", mods: {}, rules: ["Always Strikes Last"] },
    { id: "hex-nomarch", kind: "hex", name: "Cannot March", mods: {}, rules: ["Cannot March"] },
  ];

  // --- Lores of Magic ---------------------------------------------------------
  // Spells encoded as mechanical effects (stat mods + a short rule summary), not
  // flavour text. kind drives colour/handling: augment (friendly buff), hex
  // (enemy debuff), damage (a hit/utility — "instant" ones just show a reminder).
  const LORE_NAMES = {
    "battle-magic": "Battle Magic",
    "daemonology": "Daemonology",
    "dark-magic": "Dark Magic",
    "shadowlands": "Shadowlands",
    "elementalism": "Elementalism",
    "illusion": "Illusion",
    "necromancy": "Necromancy",
    "high-magic": "High Magic",
  };
  const LORES = {
    daemonology: [
      { id: "dae-sig", name: "The Summoning", type: "Magic Missile", cv: "9+", range: '18"', kind: "damage", instant: true,
        mods: {}, rules: ["Target enemy takes 2D6 hits at S4, AP -1"] },
      { id: "dae-1", name: "Steed of Shadows", type: "Conveyance", cv: "8+", range: '15"', kind: "augment",
        mods: {}, rules: ["Friendly infantry gains Fly (12)"], duration: "Until start of your next turn" },
      { id: "dae-2", name: "Gathering Darkness", type: "Hex", cv: "9+", range: '12"', kind: "hex",
        mods: { I: -2, Ld: -2 }, rules: ["Target can't use General's Inspiring Presence (I min 1, Ld min 2)"], duration: "Until start of your next turn" },
      { id: "dae-3", name: "Daemonic Familiars", type: "Assailment", cv: "8+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes 2D6 hits at S2, no armour save (Ward/Regen allowed)"] },
      { id: "dae-4", name: "Daemonic Vessel", type: "Enchantment", cv: "9+", range: "Self", kind: "augment",
        mods: { S: 1, A: 1 }, rules: ["+1 Armour Piercing on weapons (caster, mount & joined unit)"], duration: "Until end of turn" },
      { id: "dae-5", name: "Vortex of Chaos", type: "Magical Vortex", cv: "8+", range: '15"', kind: "damage",
        mods: {}, rules: ['Remains in play: 3" template is difficult terrain, scatters D6" each turn; units it crosses take D6+1 hits at S3'], duration: "Remains in play" },
      { id: "dae-6", name: "Daemonic Vigour", type: "Enchantment", cv: "9+", range: '15"', kind: "augment",
        mods: { M: 1, T: 1, I: 1 }, rules: [], duration: "Until end of turn" },
    ],
    // Paste these in to fill them out — structure matches Daemonology above.
    "battle-magic": [],
    "dark-magic": [],
    "shadowlands": [],
  };

  const DURATIONS = [
    "Until start of your next turn",
    "Until end of turn",
    "Remains in play",
    "Permanent (battle)",
  ];

  window.WOC_DATA = {
    STATS, UNITS, UNIT_INDEX, MOUNTS, MOUNT_INDEX, MARKS, GAZE_REWARDS, SPELL_EFFECTS, LORES, LORE_NAMES, DURATIONS, norm,
  };
})();
