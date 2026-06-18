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

  // --- Unit / character stat defaults (Warriors of Chaos reference) ----------
  // Profiles are the exact characteristic lines from the army reference. The
  // `category` here is only a fallback for plain-text imports — a JSON import
  // always uses the unit's actual army-composition slot. Armour saves (Sv) are
  // derived from base wargear (light 6+, heavy 5+, full plate 4+, shield +1,
  // cavalry barding +1); chosen options (extra shields etc.) aren't auto-added.
  // For cavalry/chariots, M is the steed/mount's Movement. Notes hold champion
  // profiles and key special rules. All values are editable in-app.
  const UNITS = [
    // Characters
    { name: "Chaos Lord", category: "Characters", isChar: true, profile: p(4, 7, 3, 5, 5, 4, 6, 5, 9, { Sv: 4 }), note: "Full plate. Chaos Armour (5+), Gaze of the Gods" },
    { name: "Exalted Champion", category: "Characters", isChar: true, profile: p(4, 6, 3, 5, 4, 3, 5, 4, 8, { Sv: 5 }), note: "Chaos Armour (5+), Gaze of the Gods" },
    { name: "Aspiring Champion", category: "Characters", isChar: true, profile: p(4, 5, 3, 4, 4, 2, 4, 3, 8, { Sv: 5 }), note: "Chaos Armour (5+), Gaze of the Gods" },
    { name: "Sorcerer Lord", category: "Characters", isChar: true, profile: p(4, 5, 3, 4, 4, 3, 4, 3, 8, { Sv: 5 }), note: "Wizard. Chaos Armour (5+), Lore of Chaos" },
    { name: "Exalted Sorcerer", category: "Characters", isChar: true, profile: p(4, 4, 3, 4, 4, 2, 3, 2, 8, { Sv: 6 }), note: "Wizard. Chaos Armour (5+), Lore of Chaos" },
    { name: "Daemon Prince", category: "Characters", isChar: true, profile: p(6, 7, 5, 6, 5, 4, 7, 5, 9, { Sv: 4 }), note: "Wizard. Chaos Armour (4+), Regeneration (5+), Fear, Unbreakable" },
    { name: "Marauder Tribe Chieftain", category: "Characters", isChar: true, profile: p(4, 5, 3, 4, 4, 2, 4, 3, 8, { Sv: 6 }), note: "Chaos Armour (6+), Gaze of the Gods, Warband" },
    { name: "Chaos Warhound Handler", category: "Characters", isChar: true, profile: p(5, 5, 3, 4, 4, 1, 4, 1, 8, { Sv: 5 }), note: "Handler, Loner, Vanguard" },

    // Core / regiments
    { name: "Chaos Warriors", category: "Core", profile: p(4, 5, 3, 4, 4, 1, 4, 1, 8, { Sv: 5 }), note: "Champion A2. Ensorcelled Weapons, Close Order" },
    { name: "Chaos Marauders", category: "Core", profile: p(4, 4, 3, 3, 3, 1, 3, 1, 6, { Sv: 6 }), note: "Headman A2. Horde, Shieldwall, Warband" },
    { name: "Marauder Horsemen", category: "Core", profile: p(8, 4, 3, 3, 3, 1, 3, 1, 6, { Sv: 5 }), note: "Warhorse (M8). Horsemaster A2. Fast Cavalry, Fire & Flee" },
    { name: "Chaos Warhounds", category: "Core", profile: p(7, 4, 0, 3, 3, 1, 3, 1, 6, { Sv: null }), note: "Loner, Open Order, Swiftstride" },
    { name: "Marauder Tribe Berserkers", category: "Core", profile: p(5, 4, 3, 3, 4, 1, 3, 1, 7, { Sv: 6 }), note: "Headtaker A2. Frenzy, Skirmishers, Warband" },
    { name: "Marauder Tribe Huscarls", category: "Core", profile: p(8, 4, 3, 3, 4, 1, 3, 1, 7, { Sv: 6 }), note: "Warhorse (M8). First Sword A2. Counter Charge, Furious Charge" },

    // Special / Rare
    { name: "Chaos Knights", category: "Special", profile: p(7, 5, 3, 4, 4, 1, 4, 1, 8, { Sv: 3 }), note: "Chaos Steed (M7). Champion A2. heavy+shield+barding" },
    { name: "Chosen Chaos Warriors", category: "Special", profile: p(4, 5, 3, 4, 4, 1, 4, 2, 9, { Sv: 5 }), note: "Champion A3. Chaos Armour (6+), Stubborn" },
    { name: "Chosen Chaos Knights", category: "Special", profile: p(7, 5, 3, 4, 4, 1, 4, 2, 9, { Sv: 3 }), note: "Chaos Steed (M7). Champion A3. Chaos Armour (6+), Stubborn" },
    { name: "Chaos Chariot", category: "Special", isChar: false, monster: true, profile: p(7, null, null, 5, 5, 4, null, null, null, { Sv: 3 }), note: "Charioteers WS5 A1, Steeds A1. Impact Hits (D6+1)" },
    { name: "Chosen Chaos Chariot", category: "Special", isChar: false, monster: true, profile: p(7, null, null, 5, 5, 4, null, null, null, { Sv: 3 }), note: "Charioteers WS5 A2 Ld9. Impact Hits (D6+1)" },
    { name: "Gorebeast Chariot", category: "Special", isChar: false, monster: true, profile: p(6, null, null, 5, 5, 4, null, null, null, { Sv: 3 }), note: "Gorebeast S5 A3; Charioteers WS5 A1. Impact Hits (D6+2)" },
    { name: "Chaos Ogres", category: "Special", profile: p(6, 3, 2, 4, 4, 3, 2, 3, 7, { Sv: 5 }), note: "Champion A4. Armour Bane (1), Fear, Impact Hits (1)" },
    { name: "Forsaken", category: "Special", profile: p(5, 4, 0, 4, 4, 1, 3, "D3", 8, { Sv: 5 }), note: "Random Attacks (D3). Furious Charge, Impetuous, Stubborn" },
    { name: "Skin Wolves", category: "Special", profile: p(7, 5, null, 4, 4, 3, 4, 3, 7, { Sv: null }), note: "Jarl A4. Regeneration (5+), Skirmishers, Primal Fury" },
    { name: "Chaos Trolls", category: "Rare", profile: p(6, 3, 1, 5, 4, 3, 2, 3, 4, { Sv: 6 }), note: "Regeneration (5+), Stupidity, Flammable, Fear" },
    { name: "Chaos Spawn", category: "Rare", isChar: false, monster: true, profile: p("2D6+1", 3, 0, 4, 5, 3, 3, "D6", 10, { Sv: 5 }), note: "Random Attacks/Movement, Unbreakable, Fear" },
    { name: "Chimera", category: "Rare", isChar: false, monster: true, profile: p(6, 4, 0, 6, 5, 4, 3, 6, 5, { Sv: 5 }), note: "Fly (10), Terror, Large Target, Armour Bane (2)" },
    { name: "Gigantic Spawn of Chaos", category: "Rare", isChar: false, monster: true, profile: p("3D6", 3, 0, 6, 6, 6, 3, "D6+1", 10, { Sv: 5 }), note: "Behemoth. Random Attacks/Movement, Terror, Unbreakable" },
    { name: "Hellcannon", category: "Rare", isChar: false, monster: true, profile: p(3, 4, 3, 5, 6, 5, 1, 5, 4, { Sv: 4 }), note: "Behemoth. Dwarf Handlers (WS4 A1). Terror, Impact Hits (D6)" },
    { name: "Warpfire Dragon", category: "Rare", isChar: false, monster: true, profile: p(6, 6, 0, 6, 6, 6, 3, 5, 8, { Sv: 4 }), note: "Behemoth. Fly (10), Terror, Lore of Chaos, Magic Resistance (-2)" },

    // Named characters
    { name: "Frydaal The Chainmaker", category: "Characters", isChar: true, profile: p(4, 6, 3, 5, 4, 3, 5, 4, 9, { Sv: 3 }), note: "Named. Full plate + shield. Storm's Wrath, Gaze of the Gods" },
    { name: "Galrauch", category: "Characters", isChar: true, monster: true, profile: p(6, 6, 3, 6, 6, 6, 4, 6, 9, { Sv: 4 }), note: "Named. Behemoth. Wizard (Dark Magic). Fly (10), Mark of Tzeentch, Terror" },
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
  // The Old World: a ridden mount is part of the rider's model. A "+N" value is
  // ADDED to the rider's characteristic (e.g. a Chaos Dragon gives +1 T and +6 W);
  // a plain number is the mount's OWN value (its Movement and its own attacks);
  // null ("-") means none. The model moves at the mount's Movement.
  const MOUNTS = [
    { name: "Chaos Steed", profile: { M: 7, WS: 3, BS: null, S: 4, T: null, W: null, I: 3, A: 1, Ld: null }, note: "Counter Charge, First Charge, Swiftstride; barding" },
    { name: "Warhorse", profile: { M: 8, WS: 3, BS: null, S: 3, T: null, W: null, I: 3, A: 1, Ld: null }, note: "Counter Charge, Fast Cavalry, Swiftstride" },
    { name: "Daemonic Mount", profile: { M: 8, WS: 4, BS: null, S: 5, T: null, W: "+1", I: 3, A: 2, Ld: null }, note: "Armour Bane (1), Fear, Magical Attacks, Mark of Chaos" },
    { name: "Chaos Dragon", profile: { M: 6, WS: 6, BS: null, S: 7, T: "+1", W: "+6", I: 4, A: 6, Ld: null }, note: "Fly (10), Impetuous, Large Target, Stomp Attacks (D6), Swiftstride, Terror, Two-headed Dragon" },
    { name: "Manticore", profile: { M: 6, WS: 5, BS: null, S: 5, T: null, W: "+4", I: 5, A: 4, Ld: null }, note: "Fly (9), Large Target, Stomp Attacks (D3), Swiftstride, Terror, Wilful Beast" },
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
    "nurgle": "Mark of Nurgle",
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
    // Signature spell available to Mark of Nurgle wizards (any lore).
    nurgle: [
      { id: "nurgle-sig", name: "Fleshy Abundance", type: "Enchantment", cv: "7+", range: "Self", kind: "augment",
        mods: { T: 1 }, rules: ["Mark of Nurgle only; remains in play; caster & joined unit (T max 7)"], duration: "Remains in play" },
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
