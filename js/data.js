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

  // --- Marks of Chaos ---------------------------------------------------------
  // mods are numeric profile adjustments; rules are descriptive tags.
  const MARKS = {
    khorne: { name: "Mark of Khorne", mods: { A: 1 }, rules: ["Frenzy"] },
    nurgle: { name: "Mark of Nurgle", mods: {}, rules: ["Enemies in base contact suffer -1 To Hit"] },
    slaanesh: { name: "Mark of Slaanesh", mods: {}, rules: ["Immune to Psychology"] },
    tzeentch: { name: "Mark of Tzeentch", mods: { Ward: 6 }, rules: ["6+ Ward save (Tzeentch)"] },
    undivided: { name: "Mark of Undivided", mods: {}, rules: ["May re-roll on the Gaze of the Gods table"] },
  };

  // --- Gaze of the Gods table (a.k.a. "Eye of the Gods") ----------------------
  // DEFAULT MAPPING ONLY. Edit results in-app to match your Arcane Journal.
  // Each reward applies stacking profile mods and/or descriptive rules.
  const GAZE_REWARDS = [
    { id: "spawn", roll: "2", name: "The Price of Failure", mods: {}, rules: ["Model becomes a Chaos Spawn"], bad: true },
    { id: "tough", roll: "3", name: "Iron-hard Hide", mods: { T: 1 }, rules: [] },
    { id: "str", roll: "4", name: "Strength of the Gods", mods: { S: 1 }, rules: [] },
    { id: "ws", roll: "5", name: "Favoured Eye", mods: { WS: 1 }, rules: [] },
    { id: "att", roll: "6", name: "Murderous Frenzy", mods: { A: 1 }, rules: [] },
    { id: "ward", roll: "7", name: "Shield of the Gods", mods: { Ward: 5 }, rules: ["5+ Ward save"] },
    { id: "regen", roll: "8", name: "Mutated Flesh", mods: {}, rules: ["Regeneration (6+)"] },
    { id: "init", roll: "9", name: "Quickened", mods: { I: 1 }, rules: [] },
    { id: "wound", roll: "10", name: "Unholy Vigour", mods: { W: 1 }, rules: [] },
    { id: "twoatt", roll: "11", name: "Blessed by Chaos", mods: { A: 1, S: 1 }, rules: [] },
    { id: "daemon", roll: "12", name: "Apotheosis", mods: { WS: 1, S: 1, T: 1, A: 1, Ward: 5 }, rules: ["Daemonhood — 5+ Ward, Terror"] },
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

  const DURATIONS = [
    "Until start of your next turn",
    "Until end of turn",
    "Remains in play",
    "Permanent (battle)",
  ];

  window.WOC_DATA = {
    STATS, UNITS, UNIT_INDEX, MARKS, GAZE_REWARDS, SPELL_EFFECTS, DURATIONS, norm,
  };
})();
