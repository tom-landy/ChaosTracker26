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
    { name: "Chaos Lord", category: "Characters", isChar: true, gaze: true, profile: p(4, 7, 3, 5, 5, 4, 6, 5, 9, { Sv: 4 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Gaze of the Gods", "Rallying Cry"], note: "Full plate armour" },
    { name: "Exalted Champion", category: "Characters", isChar: true, gaze: true, profile: p(4, 6, 3, 5, 4, 3, 5, 4, 8, { Sv: 5 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Gaze of the Gods", "Rallying Cry"] },
    { name: "Aspiring Champion", category: "Characters", isChar: true, gaze: true, profile: p(4, 5, 3, 4, 4, 2, 4, 3, 8, { Sv: 5 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Gaze of the Gods", "Rallying Cry"] },
    { name: "Sorcerer Lord", category: "Characters", isChar: true, gaze: true, profile: p(4, 5, 3, 4, 4, 3, 4, 3, 8, { Sv: 5 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Gaze of the Gods", "Lore of Chaos"], note: "Wizard" },
    { name: "Exalted Sorcerer", category: "Characters", isChar: true, gaze: true, profile: p(4, 4, 3, 4, 4, 2, 3, 2, 8, { Sv: 6 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Gaze of the Gods", "Lore of Chaos"], note: "Wizard" },
    { name: "Daemon Prince", category: "Characters", isChar: true, gaze: true, profile: p(6, 7, 5, 6, 5, 5, 7, 5, 9, { Sv: 4 }), rules: ["Chaos Armour (4+)", "Ensorcelled Weapons", "Fear", "Gaze of the Gods", "Immune to Psychology", "Lore of Chaos", "Regeneration (5+)", "Stomp Attacks (D3+1)", "Unbreakable", "Unstable"], note: "Wizard" },
    { name: "Marauder Tribe Chieftain", category: "Characters", isChar: true, gaze: true, profile: p(4, 5, 3, 4, 4, 2, 4, 3, 8, { Sv: 6 }), rules: ["Chaos Armour (6+)", "Gaze of the Gods", "Rallying Cry", "Warband"] },
    { name: "Chaos Warhound Handler", category: "Characters", isChar: true, profile: p(5, 5, 3, 4, 4, 1, 4, 1, 8, { Sv: 5 }), rules: ["Handler", "Loner", "Move Through Cover", "Vanguard"] },

    // Core / regiments
    { name: "Chaos Warriors", category: "Core", profile: p(4, 5, 3, 4, 4, 1, 4, 1, 8, { Sv: 5 }), champ: { A: 2 }, champName: "Champion", rules: ["Chaos Armour (6+)", "Close Order", "Ensorcelled Weapons", "Furious Charge"] },
    { name: "Chaos Marauders", category: "Core", profile: p(4, 4, 3, 3, 3, 1, 3, 1, 6, { Sv: 6 }), champ: { A: 2, Ld: 7 }, champName: "Headman", rules: ["Close Order", "Horde", "Shieldwall", "Warband"] },
    { name: "Marauder Horsemen", category: "Core", profile: p(8, 4, 3, 3, 3, 1, 3, 1, 6, { Sv: 5 }), champ: { A: 2, Ld: 7 }, champName: "Horsemaster", rules: ["Fast Cavalry", "Fire & Flee", "Open Order", "Swiftstride", "Warband"], note: "Warhorse" },
    { name: "Chaos Warhounds", category: "Core", profile: p(7, 4, 0, 3, 3, 1, 3, 1, 6, { Sv: null }), rules: ["Loner", "Move Through Cover", "Open Order", "Swiftstride"] },
    { name: "Marauder Tribe Berserkers", category: "Core", profile: p(5, 4, 3, 3, 4, 1, 3, 1, 7, { Sv: 6 }), champ: { A: 2, Ld: 8 }, champName: "Headtaker", rules: ["Frenzy", "Move Through Cover", "Open Order", "Relentless Warriors", "Skirmishers", "Warband"] },
    { name: "Marauder Tribe Huscarls", category: "Core", profile: p(8, 4, 3, 3, 4, 1, 3, 1, 7, { Sv: 6 }), champ: { A: 2, Ld: 8 }, champName: "First Sword", rules: ["Close Order", "Counter Charge", "Furious Charge", "Swiftstride", "Warband"], note: "Warhorse" },

    // Special / Rare
    { name: "Chaos Knights", category: "Special", profile: p(7, 5, 3, 4, 4, 1, 4, 1, 8, { Sv: 3 }), champ: { A: 2 }, champName: "Champion", rules: ["Chaos Armour (6+)", "Close Order", "Counter Charge", "Ensorcelled Weapons", "First Charge", "Swiftstride"], note: "Chaos Steed. heavy armour + shield + barding" },
    { name: "Chosen Chaos Warriors", category: "Special", profile: p(4, 5, 3, 4, 4, 1, 4, 2, 9, { Sv: 5 }), champ: { A: 3 }, champName: "Champion", rules: ["Chaos Armour (6+)", "Close Order", "Ensorcelled Weapons", "Furious Charge", "Stubborn"] },
    { name: "Chosen Chaos Knights", category: "Special", profile: p(7, 5, 3, 4, 4, 1, 4, 2, 9, { Sv: 3 }), champ: { A: 3 }, champName: "Champion", rules: ["Chaos Armour (6+)", "Close Order", "Counter Charge", "Ensorcelled Weapons", "First Charge", "Stubborn", "Swiftstride"], note: "Chaos Steed" },
    { name: "Chaos Chariot", category: "Special", isChar: false, monster: true, profile: p(7, null, null, 5, 5, 4, null, null, null, { Sv: 3 }), rules: ["Close Order", "Ensorcelled Weapons", "First Charge", "Impact Hits (D6+1)"], note: "Charioteers WS5 A1; Steeds A1" },
    { name: "Chosen Chaos Chariot", category: "Special", isChar: false, monster: true, profile: p(7, null, null, 5, 5, 4, null, null, null, { Sv: 3 }), rules: ["Close Order", "Counter Charge", "Ensorcelled Weapons", "First Charge", "Impact Hits (D6+1)"], note: "Charioteers WS5 A2 Ld9" },
    { name: "Gorebeast Chariot", category: "Special", isChar: false, monster: true, profile: p(6, null, null, 5, 5, 4, null, null, null, { Sv: 3 }), rules: ["Armour Bane (1)", "Close Order", "Ensorcelled Weapons", "First Charge", "Impact Hits (D6+2)", "Killing Blow"], note: "Gorebeast S5 A3; Charioteers WS5 A1" },
    { name: "Chaos Ogres", category: "Special", profile: p(6, 3, 2, 4, 4, 3, 2, 3, 7, { Sv: 5 }), champ: { A: 4 }, champName: "Champion", rules: ["Armour Bane (1)", "Close Order", "Fear", "Impact Hits (1)", "Ogre Charge"] },
    { name: "Forsaken", category: "Special", profile: p(5, 4, 0, 4, 4, 1, 3, "D3", 8, { Sv: 5 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Furious Charge", "Immune to Psychology", "Impetuous", "Loner", "Open Order", "Rampant Mutation", "Random Attacks", "Stubborn"] },
    { name: "Skin Wolves", category: "Special", profile: p(7, 5, null, 4, 4, 3, 4, 3, 7, { Sv: null }), champ: { A: 4 }, champName: "Jarl", rules: ["Blood Rage", "Fear", "Open Order", "Primal Fury", "Regeneration (5+)", "Skirmishers", "Swiftstride", "Warped Form"] },
    { name: "Chaos Trolls", category: "Rare", profile: p(6, 3, 1, 5, 4, 3, 2, 3, 6, { Sv: 6 }), rules: ["Armour Bane (1)", "Close Order", "Fear", "Flammable", "Motley Crew", "Regeneration (5+)", "Stupidity"] },
    { name: "Chaos Spawn", category: "Rare", isChar: false, monster: true, profile: p("2D6+1", 3, 0, 4, 5, 3, 3, "D6", 10, { Sv: 5 }), rules: ["Armour Bane (2)", "Fear", "Immune to Psychology", "Open Order", "Random Attacks", "Random Movement", "Stomp Attacks (1)", "Unbreakable"] },
    { name: "Chimera", category: "Rare", isChar: false, monster: true, profile: p(6, 4, 0, 6, 5, 5, 3, 6, 5, { Sv: 5 }), rules: ["Armour Bane (2)", "Close Order", "Fly (10)", "Large Target", "Stomp Attacks (D3)", "Swiftstride", "Terror"] },
    { name: "Gigantic Spawn of Chaos", category: "Rare", isChar: false, monster: true, profile: p("3D6", 3, 0, 6, 6, 6, 3, "D6+1", 10, { Sv: 5 }), rules: ["Armour Bane (2)", "Close Order", "First Charge", "Immune to Psychology", "Large Target", "Random Attacks", "Random Movement", "Stomp Attacks (D6)", "Terror", "Unbreakable"], note: "Behemoth" },
    { name: "Hellcannon", category: "Rare", isChar: false, monster: true, profile: p(3, 4, 3, 5, 6, 5, 1, 5, 4, { Sv: 4 }), rules: ["Armour Bane (1)", "Caged Fury", "Close Order", "Ensorcelled Weapons", "Immune to Psychology", "Impact Hits (D6)", "Large Target", "Regeneration (6+)", "Terror", "Unbreakable", "Warp-spawned"], note: "Behemoth. Dwarf Handlers WS4 A1" },
    { name: "Warpfire Dragon", category: "Rare", isChar: false, monster: true, profile: p(6, 6, 0, 6, 6, 6, 3, 5, 8, { Sv: 4 }), rules: ["Close Order", "Fly (10)", "Large Target", "Lore of Chaos", "Magical Attacks", "Magic Resistance (-2)", "Regeneration (5+)", "Stomp Attacks (D6)", "Swiftstride", "Terror"], note: "Behemoth" },

    // Named characters
    { name: "Frydaal The Chainmaker", category: "Characters", isChar: true, gaze: true, profile: p(4, 6, 3, 5, 4, 3, 5, 4, 9, { Sv: 3 }), rules: ["Chaos Armour (5+)", "Ensorcelled Weapons", "Gaze of the Gods", "Rallying Cry", "Impact Hits (1)", "Ambushers", "Peerless Raider"], note: "Named. Full plate + shield. Storm's Wrath" },
    { name: "Galrauch", category: "Characters", isChar: true, monster: true, profile: p(6, 6, 3, 6, 6, 6, 4, 6, 9, { Sv: 4 }), rules: ["Fly (10)", "Large Target", "Regeneration (5+)", "Terror", "Two-headed Dragon", "Stomp Attacks (D6)", "Swiftstride", "Mark of Tzeentch"], note: "Named. Behemoth. Wizard (Dark Magic)" },
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
    { name: "Daemonic Mount", profile: { M: 8, WS: 4, BS: null, S: 5, T: null, W: "+1", I: 3, A: 2, Ld: null }, note: "Armour Bane (1), Fear, Magical Attacks, Counter Charge, Mark of Chaos; barding" },
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
    { id: "hex-sv1", kind: "hex", name: "-1 Armour Save", mods: { SvMod: 1 }, rules: ["-1 to armour value"] },
    { id: "hex-sv2", kind: "hex", name: "-2 Armour Save", mods: { SvMod: 2 }, rules: ["-2 to armour value (e.g. Plague of Rust)"] },
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
    "undivided": "Mark: Undivided",
    "khorne": "Mark: Khorne",
    "nurgle": "Mark: Nurgle",
    "slaanesh": "Mark: Slaanesh",
    "tzeentch": "Mark: Tzeentch",
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
    shadowlands: [
      { id: "shd-sig", name: "Maelstrom of Chaos", type: "Magic Missile", cv: "7+", range: '15"', kind: "damage", instant: true,
        mods: {}, rules: ['3" template over target, scatters D3+1"; models under it take a single S4 hit, AP -3'] },
      { id: "shd-1", name: "Blackened Bolts", type: "Magic Missile", cv: "8+", range: '18"', kind: "damage", instant: true,
        mods: {}, rules: ["2D6 hits at S3, AP -1; any unsaved wound forces a Panic test (as heavy casualties)"] },
      { id: "shd-2", name: "Veil of Gloom", type: "Enchantment", cv: "9+", range: '15"', kind: "augment",
        mods: {}, rules: ["Friendly unit: 4+ ward vs template wounds, 5+ ward vs Shooting wounds"], duration: "Until start of your next turn" },
      { id: "shd-3", name: "Vortex of Darkness", type: "Magical Vortex", cv: "10+", range: '15"', kind: "damage",
        mods: {}, rules: ['Remains in play: 3" template = difficult terrain, scatters D6"/turn; units crossed take 3D6 hits at S2, no armour (Ward/Regen allowed)'], duration: "Remains in play" },
      { id: "shd-4", name: "Shadowed Assailants", type: "Assailment", cv: "8+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes 3D6 hits at S1, no armour or Regen (Ward allowed)"] },
      { id: "shd-5", name: "Crawling Mists", type: "Conveyance", cv: "6+/9+", range: "Self", kind: "augment",
        mods: {}, rules: ["6+: one friendly unit within 6\" gains Reserve Move; 9+: all friendly units within 6\""], duration: "Until end of turn" },
      { id: "shd-6", name: "Chains of Darkness", type: "Hex", cv: "8+", range: '18"', kind: "hex",
        mods: { M: -1, Ld: -1 }, rules: ["Target: -1 M (min 1), -1 Ld (min 2)"], duration: "Until start of your next turn" },
    ],
    // Lore of Chaos signature spells (chosen by the wizard's Mark of Chaos).
    undivided: [
      { id: "loc-undivided", name: "Winds of Chaos", type: "Hex", cv: "7+/9+", range: '21"', kind: "hex",
        mods: { M: -1 }, rules: ["Undivided only. -1 M (cast 7+) or -2 M (cast 9+), min 1"], duration: "Until start of your next turn" },
    ],
    slaanesh: [
      { id: "loc-slaanesh", name: "Acquiescence", type: "Hex", cv: "6+", range: '12"', kind: "hex",
        mods: {}, rules: ["Slaanesh only. Target Strikes Last until end of the Combat phase"], duration: "Until end of turn" },
    ],
    nurgle: [
      { id: "nurgle-sig", name: "Fleshy Abundance", type: "Enchantment", cv: "7+", range: "Self", kind: "augment",
        mods: { T: 1 }, rules: ["Nurgle only; remains in play; caster & joined unit (T max 7)"], duration: "Remains in play" },
    ],
    tzeentch: [
      { id: "loc-tzeentch", name: "Blue Fire", type: "Magic Missile", cv: "9+", range: '18"', kind: "damage", instant: true,
        mods: {}, rules: ["Tzeentch only. D6+3 hits at S4, AP -2, Flaming Attacks"] },
    ],
    "battle-magic": [
      { id: "bm-sig", name: "Hammerhand", type: "Assailment", cv: "7+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes 2D3 hits at S4, AP -2"] },
      { id: "bm-1", name: "Fireball", type: "Magic Missile", cv: "8+", range: '24"', kind: "damage", instant: true,
        mods: {}, rules: ["2D6 hits at S4, Flaming Attacks"] },
      { id: "bm-2", name: "Curse of Arrow Attraction", type: "Hex", cv: "7+", range: '21"', kind: "hex",
        mods: {}, rules: ["Re-roll natural 1s To Hit when shooting at the target"], duration: "Until start of your next turn" },
      { id: "bm-3", name: "Pillar of Fire", type: "Magical Vortex", cv: "9+", range: '12"', kind: "damage",
        mods: {}, rules: ['Remains in play: 3" template = difficult terrain, scatters D6"/turn; units crossed take D3+3 hits at S3, AP -2, Flaming'], duration: "Remains in play" },
      { id: "bm-4", name: "Arcane Urgency", type: "Conveyance", cv: "9+", range: '15"', kind: "augment", instant: true,
        mods: {}, rules: ["A friendly unit that has already moved may immediately move again"] },
      { id: "bm-5", name: "Oaken Shield", type: "Enchantment", cv: "7+", range: "Self", kind: "augment",
        mods: { Ward: 5 }, rules: ["5+ Ward save (caster & joined unit)"], duration: "Until start of your next turn" },
      { id: "bm-6", name: "Curse of Cowardly Flight", type: "Hex", cv: "8+", range: '15"', kind: "hex", instant: true,
        mods: {}, rules: ["Target makes a Panic test (even if it auto-passes); Gives Ground if failed"] },
    ],
    "dark-magic": [
      { id: "dm-sig", name: "Doombolt", type: "Magic Missile", cv: "8+", range: '24"', kind: "damage", instant: true,
        mods: {}, rules: ['3" template over target; models under it take a single S3 hit, AP -2'] },
      { id: "dm-1", name: "Word of Pain", type: "Hex", cv: "10+", range: '18"', kind: "hex",
        mods: { S: -1, T: -1 }, rules: ["-1 S, -1 T (min 1); may target a unit in combat"], duration: "Until start of your next turn" },
      { id: "dm-2", name: "Stream of Corruption", type: "Assailment", cv: "8+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Flame template; models under it take a single S3 hit, AP -1"] },
      { id: "dm-3", name: "Infernal Gateway", type: "Conveyance", cv: "9+", range: '12"', kind: "augment", instant: true,
        mods: {}, rules: ['Teleport a friendly character up to 12" (may leave combat)'] },
      { id: "dm-4", name: "Phantasmagoria", type: "Magical Vortex", cv: "9+", range: '12"', kind: "damage",
        mods: {}, rules: ['Remains in play: 3" template (dangerous terrain, no move). Enemies ending within 12" take a Panic test; passers become Impetuous near it'], duration: "Remains in play" },
      { id: "dm-5", name: "Battle Lust", type: "Enchantment", cv: "9+", range: '12"', kind: "augment",
        mods: { A: 1 }, rules: ["Frenzy and Hatred (all enemies)"], duration: "Until end of turn" },
      { id: "dm-6", name: "Soul Eater", type: "Assailment", cv: "7+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["One enemy model takes a S3 hit with Multiple Wounds (3), no armour (Ward/Regen allowed)"] },
    ],
  };

  // --- Universal lores (core rulebook) ---------------------------------------
  // Available to several factions (Empire, High Elves, …) but NOT to Chaos, so
  // they're kept out of the Chaos LORES map above and exposed via LORE_LIB for
  // the other faction data files to compose their own lore lists from.
  const UNIVERSAL_LORES = {
    "elementalism": [
      { id: "el-sig", name: "Storm Call", type: "Hex", cv: "7+", range: '12"', kind: "hex",
        mods: { M: -1, I: -1 }, rules: ["-1 M, -1 I (min 1); expires any other Hex on the target"], duration: "Until start of your next turn" },
      { id: "el-1", name: "Flaming Sword", type: "Assailment", cv: "8+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes D6+1 hits at S3, Flaming Attacks"] },
      { id: "el-2", name: "Plague of Rust", type: "Hex", cv: "9+", range: '21"', kind: "hex",
        mods: { SvMod: 2 }, rules: ["-2 to armour value (may target a unit in combat)"], duration: "Until start of your next turn" },
      { id: "el-3", name: "Summon Elemental Spirit", type: "Magical Vortex", cv: "9+", range: '15"', kind: "damage",
        mods: {}, rules: ['Remains in play: 3" template = dangerous terrain, blocks line of sight, moves D6"/turn; units it crosses take D3+3 hits at S4, AP -1'], duration: "Remains in play" },
      { id: "el-4", name: "Earthen Ramparts", type: "Enchantment", cv: "10+", range: '15"', kind: "augment",
        mods: { Ward: 5 }, rules: ["5+ Ward save; counts as behind a defended obstacle if charged; but cannot march or charge"], duration: "Until start of your next turn" },
      { id: "el-5", name: "Wind Blast", type: "Magic Missile", cv: "8+", range: '15"', kind: "damage", instant: true,
        mods: {}, rules: ["D3+3 hits at S5, AP -1; target must then Give Ground"] },
      { id: "el-6", name: "Travel Mystical Pathway", type: "Conveyance", cv: "10+", range: '9"', kind: "augment", instant: true,
        mods: {}, rules: ['Teleport a friendly unit up to 12" (not within 6" of enemies); it cannot move again this phase'] },
    ],
    "illusion": [
      { id: "il-sig", name: "Glittering Robe", type: "Enchantment", cv: "8+", range: "Self", kind: "augment",
        mods: {}, rules: ["Enemies -1 To Hit vs caster & joined unit; expires any other Enchantment on them"], duration: "Until start of your next turn" },
      { id: "il-1", name: "Mind Razor", type: "Magic Missile", cv: "7+", range: '15"', kind: "damage", instant: true,
        mods: {}, rules: ["Target takes a Ld test: passed = D3 hits at S3; failed = D3+3 hits at S4, AP -3"] },
      { id: "il-2", name: "Shimmering Dragon", type: "Conveyance", cv: "8+", range: '12"', kind: "augment",
        mods: {}, rules: ["Friendly character gains Fly (10)"], duration: "Until end of turn" },
      { id: "il-3", name: "Column of Crystal", type: "Magical Vortex", cv: "10+", range: '9"', kind: "damage",
        mods: {}, rules: ['Remains in play: 5" template = impassable terrain, blocks line of sight, does not move'], duration: "Remains in play" },
      { id: "il-4", name: "Confounding Convocation", type: "Hex", cv: "9+", range: '9"', kind: "hex",
        mods: {}, rules: ["Remains in play: target is subject to Stupidity"], duration: "Remains in play" },
      { id: "il-5", name: "Spectral Doppelganger", type: "Assailment", cv: "9+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes 2D6 hits using the caster's profile & weapon"] },
      { id: "il-6", name: "Miasmic Mirage", type: "Hex", cv: "11+", range: '15"', kind: "hex",
        mods: { M: -2 }, rules: ["-2 M (min 1); cannot march or charge; expires any other Hex on the target"], duration: "Until start of your next turn" },
    ],
    "necromancy": [
      { id: "nec-sig", name: "The Dwellers Below", type: "Assailment", cv: "7+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ['3" template on an enemy unit in combat, scatters D3+1"; models under it take a single S3 hit'] },
      { id: "nec-1", name: "Deathly Cabal", type: "Enchantment", cv: "10+", range: "Self", kind: "augment",
        mods: {}, rules: ["6+ Ward vs non-magical attacks; gain Fear (or Terror if already Fear) — caster & joined unit"], duration: "Until start of your next turn" },
      { id: "nec-2", name: "Unquiet Spirits", type: "Magic Missile", cv: "8+", range: '15"', kind: "damage", instant: true,
        mods: {}, rules: ["3D6 hits at S2, no armour save (Ward/Regen allowed)"] },
      { id: "nec-3", name: "Spiritual Vortex", type: "Magical Vortex", cv: "11+", range: '12"', kind: "damage",
        mods: {}, rules: ['Remains in play: 5" template = dangerous terrain; enemies within 8" get -1 Ld (min 2) & cannot use their General\'s Inspiring Presence'], duration: "Remains in play" },
      { id: "nec-4", name: "Curse of Years", type: "Hex", cv: "10+", range: '15"', kind: "hex",
        mods: { M: -1, WS: -1, T: -1 }, rules: ["-1 M, -1 WS, -1 T (min 1); expires any other Hex on the target"], duration: "Until start of your next turn" },
      { id: "nec-5", name: "Spectral Steed", type: "Conveyance", cv: "9+", range: '12"', kind: "augment",
        mods: {}, rules: ["Remains in play: friendly infantry character gains Ethereal & Fly (10)"], duration: "Remains in play" },
      { id: "nec-6", name: "Spirit Leech", type: "Hex", cv: "8+", range: '18"', kind: "hex",
        mods: { Ld: -2 }, rules: ["-2 Ld (min 2); can't use General's Inspiring Presence (may target a unit in combat)"], duration: "Until end of turn" },
    ],
    // Lore of High Magic (the Lore of Saphery used by High Elf mages).
    "high-magic": [
      { id: "hm-sig", name: "Drain Magic", type: "Hex", cv: "9+", range: "Self", kind: "hex",
        mods: {}, rules: ['Remains in play: enemy Wizards within 24" of the caster must increase their spells\' casting value by 2'], duration: "Remains in play" },
      { id: "hm-1", name: "Walk Between Worlds", type: "Conveyance", cv: "10+", range: "Self", kind: "augment",
        mods: {}, rules: ["Caster & joined unit gain Ethereal and Reserve Move"], duration: "Until start of your next turn" },
      { id: "hm-2", name: "Fiery Convocation", type: "Magic Missile", cv: "10+", range: '18"', kind: "damage", instant: true,
        mods: {}, rules: ['5" template over the target, scatters D3+1"; models under it take a S4 hit, AP -2, Flaming Attacks'] },
      { id: "hm-3", name: "Tempest", type: "Magical Vortex", cv: "9+", range: '12"', kind: "damage",
        mods: {}, rules: ['Remains in play: 3" template = dangerous terrain; within 6" enemies treat open ground as difficult, difficult as dangerous'], duration: "Remains in play" },
      { id: "hm-4", name: "Corporeal Unmaking", type: "Assailment", cv: "8+", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes D3 hits at S5, no armour or Regen (Ward allowed)"] },
      { id: "hm-5", name: "Fury of Khaine", type: "Enchantment", cv: "9+", range: '12"', kind: "augment",
        mods: { A: 1 }, rules: ["Friendly unit gains Extra Attacks (+1) (may target a unit in combat)"], duration: "Until end of turn" },
      { id: "hm-6", name: "Shield of Saphery", type: "Enchantment", cv: "9+", range: '18"', kind: "augment",
        mods: { Ward: 5 }, rules: ["5+ Ward save; expires any other Enchantment on the target"], duration: "Until end of turn" },
    ],
  };
  // Shared library other factions pick from (Chaos-relevant lores + universal).
  const LORE_LIB = Object.assign({
    "battle-magic": LORES["battle-magic"],
    "dark-magic": LORES["dark-magic"],
    "daemonology": LORES["daemonology"],
  }, UNIVERSAL_LORES);

  // --- Gifts, magic items & chaotic traits -----------------------------------
  // cat groups them in the picker. mods apply to the model's live stats; rules
  // are a short effect reminder shown as a tag. Saves: full plate -> Sv 4,
  // heavy -> Sv 5. Points are intentionally omitted (they change with FAQs).
  const ITEM_CATEGORIES = [
    ["gift", "Gifts of Chaos"],
    ["weapon", "Magic Weapons"],
    ["armour", "Magic Armour"],
    ["talisman", "Talismans"],
    ["standard", "Magic Standards"],
    ["enchanted", "Enchanted Items"],
    ["arcane", "Arcane Items"],
    ["trait", "Chaotic Traits"],
  ];
  const ITEMS = [
    // Gifts of Chaos
    { id: "gift-dark-majesty", cat: "gift", name: "Dark Majesty", mods: {}, rules: ["Enemy Fear/Terror tests in Command range take an extra -1 Ld"] },
    { id: "gift-daemon-flesh", cat: "gift", name: "Daemon-flesh", mods: {}, rules: ["Cannot be wounded on a To Wound roll of 2"] },
    { id: "gift-extra-arm", cat: "gift", name: "Extra Arm", mods: { A: 1 }, rules: ["+1 Attack (not mount)"] },
    { id: "gift-diabolic", cat: "gift", name: "Diabolic Splendour", mods: {}, rules: ["Enemy shooting at this character/unit: extra -1 To Hit (inf/cav)"] },
    { id: "gift-enchanting", cat: "gift", name: "Enchanting Aura", mods: {}, rules: ["Enemies in combat can't Strike First; others Strike Last (inf/cav)"] },
    { id: "gift-aura-pain", cat: "gift", name: "Aura of Pain", mods: {}, rules: ["Once/game: an enemy unit in combat takes D6 S3 hits, no armour/Regen"] },
    { id: "gift-master-mortals", cat: "gift", name: "Master of Mortals", mods: {}, rules: ["Friendly Marauders/Marauder Horsemen +1 Ld in Command range"] },
    { id: "gift-acid-ichor", cat: "gift", name: "Acid Ichor", mods: {}, rules: ["In a challenge, each Wound lost inflicts a S4 AP -2 hit on the enemy"] },
    { id: "gift-poison-slime", cat: "gift", name: "Poisonous Slime", mods: {}, rules: ["Poisoned Attacks (not mount)"] },
    // Magic Weapons
    { id: "wpn-dagger", cat: "weapon", name: "Dagger of the Dark Pantheon", mods: {}, rules: ["AP -2, Magical Attacks; +1 to next Casting/Dispel per Wound caused"] },
    { id: "wpn-chieftain", cat: "weapon", name: "Chieftain's Blade", mods: { S: 1 }, rules: ["+1 S, AP -1, Armour Bane (1), Magical; +1 To Hit in a challenge"] },
    { id: "wpn-taskmaster", cat: "weapon", name: "Taskmaster's Scourge", mods: { A: 1 }, rules: ["+1 Attack, AP -1, Magical; Ld test for +D3 M (inf only)"] },
    { id: "wpn-spellthief", cat: "weapon", name: "Spellthieving Sword", mods: {}, rules: ["AP -1, Magical; wounded enemy Wizard forgets a random spell"] },
    // Magic Armour
    { id: "arm-damned", cat: "armour", name: "Armour of the Damned", mods: { Sv: 4 }, rules: ["Full plate; enemies must re-roll successful To Hit in combat"] },
    { id: "arm-daemonic-plate", cat: "armour", name: "Daemonic Platemail", mods: { Sv: 4, T: 1, I: 1 }, rules: ["Full plate; +1 T, +1 I (inf/cav)"] },
    { id: "arm-crimson-dargan", cat: "armour", name: "Crimson Armour of Dargan", mods: { Sv: 5 }, rules: ["Heavy armour; immune to Multiple Wounds (inf/cav)"] },
    { id: "arm-serpent-scale", cat: "armour", name: "Mighty Serpent's Scalemail", mods: { Sv: 5 }, rules: ["Heavy armour; Strike First"] },
    // Talismans
    { id: "tal-carrion-crow", cat: "talisman", name: "Talisman of the Carrion Crow", mods: {}, rules: ["Regeneration (5+), Poisoned Attacks"] },
    { id: "tal-crown-conquest", cat: "talisman", name: "Crown of Everlasting Conquest", mods: {}, rules: ["Regeneration (5+)"] },
    { id: "tal-soaring-eagle", cat: "talisman", name: "Talisman of the Soaring Eagle", mods: {}, rules: ["Magic Resistance (-2); 5+ ward vs Magical Attacks"] },
    { id: "tal-brazen-collar", cat: "talisman", name: "Brazen Collar", mods: {}, rules: ["Magic Resistance (-2)"] },
    // Magic Standards
    { id: "std-banner-gods", cat: "standard", name: "Banner of the Gods", mods: {}, rules: ["Unit ignores all negative Ld modifiers"] },
    { id: "std-doom-totem", cat: "standard", name: "Doom Totem", mods: {}, rules: ["Enemies with line of sight: -1 Ld"] },
    { id: "std-dark-powers", cat: "standard", name: "Banner of the Dark Powers", mods: {}, rules: ["Magic Resistance (-3)"] },
    { id: "std-blasted", cat: "standard", name: "Blasted Standard", mods: {}, rules: ["Re-roll natural 1s on armour saves vs Shooting"] },
    { id: "std-rage", cat: "standard", name: "Banner of Rage", mods: {}, rules: ["Frenzy (cannot be lost)"] },
    { id: "std-baying-hound", cat: "standard", name: "Banner of the Baying Hound", mods: {}, rules: ["Vanguard (Heralds of Darkness)"] },
    { id: "std-sea-raider", cat: "standard", name: "Sea Raider's Crest", mods: {}, rules: ["Fear (or Terror if already Fear) (Wolves of the Sea)"] },
    { id: "std-icon-darkness", cat: "standard", name: "Icon of Darkness", mods: {}, rules: ["Enemy shooting at the unit: extra -1 To Hit"] },
    // Enchanted Items
    { id: "ench-bloodskull", cat: "enchanted", name: "Bloodskull Pendant", mods: {}, rules: ["May instead deal 1 S8 AP -1 Killing Blow hit to each enemy in base contact (inf)"] },
    { id: "ench-rod-damned", cat: "enchanted", name: "Rod of the Damned", mods: {}, rules: ["Cast The Summoning (Daemonology) as a Bound spell, Power Level 2"] },
    { id: "ench-daemon-barding", cat: "enchanted", name: "Daemon-Forged Barding", mods: {}, rules: ["On a charge: mount(s) +1 Attack (cav, Heralds of Darkness)"] },
    { id: "ench-pendant-damnation", cat: "enchanted", name: "Pendant of Damnation", mods: {}, rules: ["+1 Attack for every Wound lost (inf/cav)"] },
    { id: "ench-helm-eyes", cat: "enchanted", name: "Helm of Many Eyes", mods: {}, rules: ["Strike First (not mount); but subject to Stupidity"] },
    { id: "ench-favour-gods", cat: "enchanted", name: "Favour of the Gods", mods: {}, rules: ["Single use: re-roll the D6 on the Gaze of the Gods table"] },
    // Arcane Items
    { id: "arc-skull-katam", cat: "arcane", name: "Skull of Katam", mods: {}, rules: ["+1 Casting for bearer & any Wizard within 3\" (friend or foe)"] },
    { id: "arc-sceptre-power", cat: "arcane", name: "Sceptre of Power", mods: {}, rules: ["+1 Casting/Dispel; on a natural double, bearer takes a S10 AP -3 hit"] },
    { id: "arc-grimoire", cat: "arcane", name: "Grimoire of Ogvold", mods: {}, rules: ["Knows all 7 spells of chosen lore; casts up to Level per turn"] },
    { id: "arc-infernal-puppet", cat: "arcane", name: "Infernal Puppet", mods: {}, rules: ["If not fleeing or in combat: an enemy Wizard casting within 15\" rolls an extra D6 and discards the highest"] },
    { id: "arc-tome-dark-gods", cat: "arcane", name: "Tome of the Dark Gods", mods: {}, rules: ["Undivided: may swap spells for any Lore of Chaos mark spells"] },
    { id: "arc-spell-familiar", cat: "arcane", name: "Spell Familiar", mods: {}, rules: ["Knows one extra spell (does not raise Level)"] },
    // Chaotic Traits
    { id: "trait-dark-hearts", cat: "trait", name: "Dark Hearts", mods: {}, rules: ["Losing side of a combat: -1 Ld on Break test (inf/cav)"] },
    { id: "trait-unnatural-fortitude", cat: "trait", name: "Unnatural Fortitude", mods: { T: 1 }, rules: ["+1 T unless wearing heavy/full plate armour"] },
    { id: "trait-longstriders", cat: "trait", name: "Longstriders", mods: {}, rules: ["Vanguard unless wearing heavy/full plate armour"] },
    { id: "trait-battle-hunger", cat: "trait", name: "Battle Hunger", mods: {}, rules: ["+2\" max charge range and +D3 to Charge/Pursuit (inf, whole unit)"] },
    { id: "trait-brazen-will", cat: "trait", name: "Brazen Will", mods: {}, rules: ["Magic Resistance (-1) (inf/cav)"] },
    { id: "trait-enhanced-reflexes", cat: "trait", name: "Enhanced Reflexes", mods: {}, rules: ["+2 Initiative in combat with a single hand weapon / Ensorcelled Weapon (not mount)"] },
    { id: "trait-prophetic", cat: "trait", name: "Prophetic Foresight", mods: {}, rules: ["Enemy Scouts kept 18\" away, Ambushers 12\" away"] },
  ];
  const ITEMS_INDEX = {};
  for (const it of ITEMS) ITEMS_INDEX[norm(it.name)] = it;

  const DURATIONS = [
    "Until start of your next turn",
    "Until end of turn",
    "Remains in play",
    "Permanent (battle)",
  ];

  window.WOC_DATA = {
    STATS, UNITS, UNIT_INDEX, MOUNTS, MOUNT_INDEX, MARKS, GAZE_REWARDS, SPELL_EFFECTS, LORES, LORE_LIB, LORE_NAMES, ITEMS, ITEMS_INDEX, ITEM_CATEGORIES, DURATIONS, norm,
    // faction metadata (used by the faction-aware app)
    faction: "warriors-of-chaos", factionName: "Warriors of Chaos", theme: "chaos", hasMarks: true, hasGaze: true,
  };
  // register in the shared faction registry (Empire etc. add themselves too)
  window.FACTIONS = window.FACTIONS || {};
  window.FACTIONS["warriors-of-chaos"] = window.WOC_DATA;
})();
