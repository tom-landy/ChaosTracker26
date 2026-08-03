/*
 * ChaosTracker26 — High Elf Realms faction data (Warhammer: The Old World).
 * Registers window.FACTIONS["high-elf-realms"]. Shares generic pieces (STATS,
 * spell building blocks, the universal lores, durations) with the Chaos data.
 * Profiles are from the High Elf Realms army reference; armour saves are derived
 * from base wargear (light 6+, heavy 5+, full plate 4+, +1 shield, +1 Ithilmar
 * barding) and are editable in-app. High Elves have no Marks or Gaze of the Gods.
 *
 * Magic items & Elven Honours are not yet baked in (they live in the Arcane
 * Journal: High Elf Realms) — they still import as equipment chips.
 */
(function () {
  "use strict";
  const W = window.WOC_DATA; // shared bits live here (loaded first)
  const norm = W.norm;
  function p(M, WS, BS, S, T, Wd, I, A, Ld, extra) {
    return Object.assign({ M, WS, BS, S, T, W: Wd, I, A, Ld, Sv: null, Ward: null }, extra || {});
  }

  // --- Mounts (bracketed "+N" values add to the rider; plain M replaces) -------
  const MOUNTS = [
    { name: "Elven Steed", profile: { M: 9, WS: 3, BS: null, S: 3, T: null, W: null, I: 4, A: 1, Ld: null }, note: "Fast Cavalry, Swiftstride" },
    { name: "Barded Elven Steed", profile: { M: 8, WS: 3, BS: null, S: 3, T: null, W: null, I: 4, A: 1, Ld: null }, note: "Counter Charge, First Charge, Ithilmar Barding, Swiftstride; barding" },
    { name: "Great Eagle", profile: { M: 2, WS: 5, BS: null, S: 4, T: "+1", W: "+1", I: 4, A: 3, Ld: null }, note: "Fly (10), Fear, Stomp Attacks (1), Swiftstride" },
    { name: "Griffon", profile: { M: 6, WS: 5, BS: null, S: 5, T: "+2", W: "+3", I: 5, A: 4, Ld: null }, note: "Fly (9), Large Target, Stomp Attacks (D3), Swiftstride, Terror; griffonic pelt (heavy armour)" },
    { name: "Sun Dragon", profile: { M: 6, WS: 5, BS: null, S: 5, T: "+2", W: "+4", I: 4, A: 4, Ld: null }, note: "Fly (10), Impetuous, Large Target, Stomp Attacks (D6), Terror; draconic scales (full plate)" },
    { name: "Moon Dragon", profile: { M: 6, WS: 6, BS: null, S: 6, T: "+2", W: "+5", I: 3, A: 5, Ld: null }, note: "Fly (10), Large Target, Stomp Attacks (D6), Terror; draconic scales (full plate)" },
    { name: "Star Dragon", profile: { M: 6, WS: 7, BS: null, S: 7, T: "+3", W: "+6", I: 2, A: 6, Ld: null }, note: "Fly (10), Large Target, Stomp Attacks (D6+1), Terror; draconic scales (full plate)" },
    { name: "Flamespyre Phoenix", profile: { M: 2, WS: 5, BS: null, S: 5, T: "+2", W: "+3", I: 4, A: 3, Ld: null }, note: "Fly (10), Fear, Flaming Attacks, Large Target, Stomp Attacks (2), From the Ashes, Wake of Fire, Swiftstride" },
    { name: "Frostheart Phoenix", profile: { M: 2, WS: 6, BS: null, S: 6, T: "+3", W: "+3", I: 3, A: 4, Ld: null }, note: "Fly (9), Fear, Large Target, Stomp Attacks (2), Blizzard Aura, Swiftstride" },
    { name: "Unicorn", profile: { M: 10, WS: 4, BS: null, S: 4, T: null, W: "+1", I: 5, A: 2, Ld: null }, note: "Monstrous Cavalry; Armour Bane (2), Beguiling Aura, Counter Charge, Magical Attacks, Stomp Attacks (1), Swiftstride" },
    // Chariot mounts (character-ridden) — profiles are the chariot's own line.
    { name: "Tiranoc Chariot", profile: { M: null, WS: null, BS: null, S: 5, T: 4, W: 4, I: null, A: null, Ld: null, Sv: 5 }, note: "Light Chariot; Impact Hits (D6), Quick Shot, Swiftstride. Charioteers WS4/A1, Steeds M9" },
    { name: "Lion Chariot of Chrace", profile: { M: null, WS: null, BS: null, S: 5, T: 4, W: 4, I: null, A: null, Ld: null, Sv: 4 }, note: "Heavy Chariot; Fear, First Charge, Impact Hits (D6), Stubborn. War Lions M8/WS5/A2" },
    { name: "Lothern Skycutter", profile: { M: null, WS: null, BS: null, S: 5, T: 4, W: 4, I: null, A: null, Ld: null, Sv: 4 }, note: "Heavy Chariot; Fly (10), Fear, Impact Hits (D3+1), Swiftstride. Sea Guard crew WS4/A1" },
  ];

  // --- Units ------------------------------------------------------------------
  // Army-wide: Ithilmar Weapons, Strike First, Valour of Ages (characters);
  // most units also have Elven Reflexes. Rules imported from the list are shown
  // as tags too, so the arrays below focus on each unit's printed special rules.
  const UNITS = [
    // Characters
    { name: "Prince", category: "Characters", isChar: true, profile: p(5, 7, 7, 4, 3, 3, 6, 4, 10, { Sv: 6 }), rules: ["Ithilmar Weapons", "Strike First", "Valour of Ages"], note: "Light armour" },
    { name: "Noble", category: "Characters", isChar: true, profile: p(5, 6, 6, 4, 3, 2, 5, 3, 9, { Sv: 6 }), rules: ["Ithilmar Weapons", "Strike First", "Valour of Ages"], note: "Light armour" },
    { name: "Archmage", category: "Characters", isChar: true, profile: p(5, 4, 4, 3, 3, 3, 5, 2, 8), rules: ["Elven Reflexes", "Ithilmar Weapons", "Lileath's Blessing", "Lore of Saphery", "Valour of Ages"], note: "Wizard. Lores: High Magic, Battle Magic, Elementalism, Illusion" },
    { name: "Mage", category: "Characters", isChar: true, profile: p(5, 4, 4, 3, 3, 2, 4, 1, 8), rules: ["Elven Reflexes", "Ithilmar Weapons", "Lileath's Blessing", "Lore of Saphery", "Valour of Ages"], note: "Wizard. Lores: High Magic, Battle Magic, Elementalism, Illusion" },
    { name: "Dragon Mage", category: "Characters", isChar: true, profile: p(6, 4, 4, 3, 5, 6, 5, 2, 8, { Sv: 4 }), rules: ["Blessings of Asuryan", "Dragon Armour", "Elven Reflexes", "Fly (10)", "Impetuous", "Large Target", "Lileath's Blessing", "Lore of Saphery", "Stomp Attacks (D6)", "Swiftstride", "Terror", "Valour of Ages"], note: "Wizard on Sun Dragon (folded). Lores: Battle Magic, Elementalism. Sun Dragon WS5 S5 A4" },
    { name: "Storm Weaver", category: "Characters", isChar: true, profile: p(5, 4, 4, 3, 3, 2, 4, 2, 9), rules: ["Elven Reflexes", "Ithilmar Weapons", "Lore of Saphery", "Valour of Ages"], note: "Wizard. Lores: Dark Magic, Elementalism, Illusion" },
    { name: "Chracian Chieftain", category: "Characters", isChar: true, profile: p(5, 6, 4, 4, 3, 3, 5, 3, 9, { Sv: 5 }), rules: ["Furious Charge", "Ithilmar Weapons", "Lion Cloak", "Move Through Cover", "Strike First", "Stubborn", "Valour of Ages"], note: "Heavy armour" },
    { name: "Handmaiden of the Everqueen", category: "Characters", isChar: true, profile: p(5, 6, 7, 4, 3, 2, 6, 2, 8, { Sv: 6 }), rules: ["Arrows of Isha", "Evasive", "Ignores Cover", "Immune to Psychology", "Ithilmar Armour", "Ithilmar Weapons", "Strike First"], note: "Light armour, Handmaiden's spear, Bow of Avelorn" },
    { name: "Sea Guard Garrison Commander", category: "Characters", isChar: true, profile: p(5, 6, 7, 4, 3, 2, 5, 3, 9, { Sv: 6 }), rules: ["Accomplished Archers", "Ithilmar Weapons", "Naval Discipline", "Strike First", "Valour of Ages"], note: "Light armour, warbow" },
    // Named characters
    { name: "Korhil Lionmane", category: "Characters", isChar: true, profile: p(5, 7, 5, 4, 3, 3, 6, 4, 9, { Sv: 5 }), rules: ["Elven Reflexes", "Furious Charge", "Mighty Constitution", "Move Through Cover", "Stubborn", "Valour of Ages"], note: "Named. Heavy armour, Chayal, the Pelt of Charandis" },
    { name: "Ishaya Vess", category: "Characters", isChar: true, profile: p(5, 7, 7, 4, 3, 3, 7, 3, 9, { Sv: 4 }), rules: ["Commanding Voice", "Ithilmar Weapons", "Naval Discipline", "Precision Strikes", "Rallying Cry", "Strike First", "Valour of Ages"], note: "Named. Heavy armour, shield, Mathlann's Ire, warbow" },

    // Core
    { name: "Lothern Sea Guard", category: "Core", profile: p(5, 4, 4, 3, 3, 1, 4, 1, 8, { Sv: 6 }), champ: { BS: 5, A: 2 }, champName: "Sea Master", rules: ["Close Order", "Elven Reflexes", "Martial Prowess", "Naval Discipline", "Valour of Ages"], note: "Thrusting spears, warbows, light armour (shields optional)" },
    { name: "Elven Spearmen", category: "Core", profile: p(5, 4, 4, 3, 3, 1, 4, 1, 8, { Sv: 5 }), champ: { A: 2 }, champName: "Sentinel", rules: ["Close Order", "Elven Reflexes", "Martial Prowess", "Regimental Unit", "Valour of Ages"], note: "Thrusting spears, light armour + shields" },
    { name: "Elven Archers", category: "Core", profile: p(5, 4, 4, 3, 3, 1, 4, 1, 8), champ: { BS: 5 }, champName: "Sentinel", rules: ["Close Order", "Detachment", "Elven Reflexes", "Valour of Ages"], note: "Longbows" },
    { name: "Silver Helms", category: "Core", profile: p(8, 4, 4, 3, 3, 1, 5, 1, 8, { Sv: 4 }), champ: { A: 2 }, champName: "High Helm", rules: ["Close Order", "Elven Reflexes", "First Charge", "Ithilmar Barding", "Swiftstride", "Valour of Ages"], note: "Barded Elven Steed. Lances, heavy armour + barding (shields optional)" },
    { name: "Ship's Company", category: "Core", profile: p(5, 4, 4, 3, 3, 1, 4, 1, 8), champ: { A: 2 }, champName: "Bosun", rules: ["Detachment", "Elven Reflexes", "Evasive", "Fire & Flee", "Open Order", "Valour of Ages"], note: "Warbows" },

    // Special
    { name: "Ellyrian Reavers", category: "Special", profile: p(9, 4, 4, 3, 3, 1, 4, 1, 8, { Sv: 6 }), champ: { BS: 5, A: 2 }, champName: "Harbinger", rules: ["Elven Reflexes", "Fast Cavalry", "Open Order", "Swiftstride", "Valour of Ages"], note: "Elven Steed. Cavalry spears, light armour" },
    { name: "White Lions of Chrace", category: "Special", profile: p(5, 5, 4, 4, 3, 1, 5, 1, 8, { Sv: 5 }), champ: { A: 2 }, champName: "Guardian", rules: ["Chracian Warriors", "Close Order", "Elven Reflexes", "Furious Charge", "King's Guard", "Lion Cloak", "Move Through Cover", "Open Order", "Stubborn", "Valour of Ages"], note: "Chracian great blades, heavy armour" },
    { name: "Swordmasters of Hoeth", category: "Special", profile: p(5, 6, 4, 3, 3, 1, 6, 1, 8, { Sv: 5 }), champ: { A: 2 }, champName: "Bladelord", rules: ["Cleaving Blow", "Close Order", "Deflect Shots", "Elven Reflexes", "Ithilmar Armour", "Magic Resistance (-1)", "Valour of Ages", "Warriors of the White Tower"], note: "Swords of Hoeth, heavy armour" },
    { name: "Phoenix Guard", category: "Special", profile: p(5, 5, 4, 3, 3, 1, 5, 1, 9, { Sv: 4 }), champ: { A: 2 }, champName: "Keeper of the Flame", rules: ["Blessings of Asuryan", "Close Order", "Elven Reflexes", "Fear", "Martial Prowess", "Veteran", "Witness to Destiny"], note: "Ceremonial halberds, full plate armour" },
    { name: "Shadow Warriors", category: "Special", profile: p(5, 5, 5, 3, 3, 1, 5, 1, 8, { Sv: 6 }), champ: { BS: 6 }, champName: "Shadow-walker", rules: ["Elven Reflexes", "Evasive", "Fire & Flee", "Ithilmar Weapons", "Move Through Cover", "Scouts", "Skirmishers", "Veteran", "Warriors of Nagarythe"], note: "Longbows, light armour" },
    { name: "Dragon Princes", category: "Special", profile: p(8, 5, 4, 3, 3, 1, 5, 2, 9, { Sv: 2 }), champ: { A: 3 }, champName: "Drakemaster", rules: ["Close Order", "Counter Charge", "Dragon Armour", "Drilled", "Elven Reflexes", "First Charge", "Impetuous", "Ithilmar Barding", "Ithilmar Weapons", "Sons of Caledor", "Swiftstride", "Valour of Ages"], note: "Barded Elven Steed. Lances, full plate + shields + barding" },
    { name: "Chracian Woodsmen", category: "Special", profile: p(5, 4, 4, 4, 3, 1, 4, 1, 8, { Sv: 6 }), champ: { A: 2 }, champName: "Chracian Captain", rules: ["Elven Reflexes", "Move Through Cover", "Skirmishers", "Valour of Ages", "Vanguard"], note: "Chracian great blades, light armour" },
    { name: "Lion Guard", category: "Special", profile: p(5, 6, 4, 4, 3, 1, 5, 1, 9, { Sv: 5 }), champ: { A: 2 }, champName: "Lion Guard Captain", rules: ["Champions of Chrace", "Close Order", "Elven Reflexes", "Furious Charge", "Lion Cloak", "Stubborn", "Veteran"], note: "Chracian great blades, heavy armour" },
    { name: "War Lions", category: "Special", profile: p(8, 5, 0, 4, 4, 1, 4, 2, 7), champName: "", rules: ["Cleaving Blow", "Fear", "Move Through Cover", "Open Order", "Swiftstride", "Vanguard"], note: "War Beast" },
    { name: "Tiranoc Chariot", category: "Special", profile: p(null, null, null, 5, 4, 4, null, null, null, { Sv: 5 }), rules: ["Elven Reflexes", "Impact Hits (D6)", "Open Order", "Quick Shot", "Swiftstride", "Valour of Ages"], note: "Light Chariot. Charioteers WS4 A1; Elven Steeds M9" },
    { name: "Lion Chariot of Chrace", category: "Special", monster: true, profile: p(null, null, null, 5, 4, 4, null, null, null, { Sv: 4 }), rules: ["Close Order", "Elven Reflexes", "Fear", "First Charge", "Impact Hits (D6)", "Lion Cloak", "Stubborn", "Valour of Ages"], note: "Heavy Chariot. Charioteers WS5 A1; War Lions M8 WS5 A2" },
    { name: "Chieftain's Chariot", category: "Special", monster: true, profile: p(null, null, null, 5, 4, 3, null, null, null, { Sv: 4 }), rules: ["Armour Bane (1, Chracian Lions only)", "Close Order", "Elven Reflexes", "Fear", "First Charge", "Impact Hits (D6)", "Stubborn", "Valour of Ages"], note: "Heavy Chariot. Charioteer WS5 A1; Chracian Lions M8 WS5 A2" },
    { name: "Lothern Skycutter", category: "Special", monster: true, profile: p(null, null, null, 5, 4, 4, null, null, null, { Sv: 4 }), rules: ["Close Order", "Elven Reflexes", "Fear", "Fly (10)", "Impact Hits (D3+1)", "Swiftstride", "Valour of Ages"], note: "Heavy Chariot. Sea Guard crew WS4 A1; Swiftfeather Roc" },

    // Rare
    { name: "Eagle-Claw Bolt Thrower", category: "Rare", monster: true, profile: p(null, null, null, null, 6, 2, null, null, null), rules: ["Elven Reflexes", "Skirmishers", "Valour of Ages"], note: "War machine. Sea Guard crew WS4 BS4 A2, light armour" },
    { name: "Great Eagle", category: "Rare", monster: true, profile: p(2, 5, 0, 4, 4, 3, 4, 3, 6), rules: ["Close Order", "Fear", "Fly (10)", "Stomp Attacks (1)", "Swiftstride"], note: "Monstrous Creature" },
    { name: "Sisters of Avelorn", category: "Rare", profile: p(5, 5, 5, 3, 3, 1, 5, 1, 8, { Sv: 6 }), champ: { BS: 6 }, champName: "High Sister", rules: ["Arrows of Isha", "Evasive", "Ignores Cover", "Immune to Psychology", "Ithilmar Armour", "Ithilmar Weapons", "Open Order", "Skirmishers", "Strike First"], note: "Bows of Avelorn, light armour" },
    { name: "Flamespyre Phoenix", category: "Rare", monster: true, profile: p(2, 5, 0, 5, 5, 5, 4, 3, 7, { Sv: 5 }), rules: ["Blessings of Asuryan", "Close Order", "Fear", "Flaming Attacks", "Fly (10)", "From the Ashes", "Large Target", "Stomp Attacks (2)", "Swiftstride", "Wake of Fire"], note: "Monstrous Creature; blazing plumage (heavy armour)" },
    { name: "Frostheart Phoenix", category: "Rare", monster: true, profile: p(2, 6, 0, 6, 6, 5, 3, 4, 8, { Sv: 4 }), rules: ["Blizzard Aura", "Close Order", "Fear", "Fly (9)", "Large Target", "Stomp Attacks (2)", "Swiftstride"], note: "Monstrous Creature; frozen plumage (full plate)" },
    { name: "Merwyrm", category: "Rare", monster: true, profile: p(6, 6, 0, 6, 6, 6, 3, 4, 8, { Sv: 5 }), rules: ["Abyssal Cloak", "Close Order", "Enfeebling Cold", "Impact Hits (D3)", "Large Target", "Stomp Attacks (D3+1)", "Terror"], note: "Behemoth; iridescent scales (heavy armour)" },
  ];

  // --- Lores (High Elf mages: High Magic + universal lores) -------------------
  const LORES = {
    "high-magic": W.LORE_LIB["high-magic"],
    "battle-magic": W.LORE_LIB["battle-magic"],
    "dark-magic": W.LORE_LIB["dark-magic"],
    "elementalism": W.LORE_LIB["elementalism"],
    "illusion": W.LORE_LIB["illusion"],
  };
  const LORE_NAMES = {
    "high-magic": "High Magic (Saphery)", "battle-magic": "Battle Magic",
    "dark-magic": "Dark Magic", "elementalism": "Elementalism", "illusion": "Illusion",
  };

  // Build indexes.
  const UNIT_INDEX = {};
  for (const u of UNITS) { UNIT_INDEX[norm(u.name)] = u; UNIT_INDEX[norm(u.name).replace(/s$/, "")] = u; }
  const MOUNT_INDEX = {};
  for (const m of MOUNTS) { MOUNT_INDEX[norm(m.name)] = m; MOUNT_INDEX[norm(m.name).replace(/s$/, "")] = m; }

  window.FACTIONS = window.FACTIONS || {};
  window.FACTIONS["high-elf-realms"] = {
    STATS: W.STATS,
    UNITS, UNIT_INDEX, MOUNTS, MOUNT_INDEX,
    MARKS: {}, GAZE_REWARDS: [],
    SPELL_EFFECTS: W.SPELL_EFFECTS,
    LORES, LORE_NAMES,
    ITEMS: [], ITEMS_INDEX: {}, ITEM_CATEGORIES: [],
    DURATIONS: W.DURATIONS, norm,
    faction: "high-elf-realms", factionName: "High Elf Realms", theme: "highelves", hasMarks: false, hasGaze: false,
  };
})();
