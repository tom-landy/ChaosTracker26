/*
 * ChaosTracker26 — High Elf Realms faction data (Warhammer: The Old World).
 * Registers window.FACTIONS["high-elf-realms"]. Shares generic pieces (STATS,
 * spell building blocks, the universal lores, durations) with the Chaos data.
 * Profiles are from the High Elf Realms army reference; armour saves are derived
 * from base wargear (light 6+, heavy 5+, full plate 4+, +1 shield, +1 Ithilmar
 * barding) and are editable in-app. High Elves have no Marks or Gaze of the Gods.
 * Magic items, Elven weapons and Elven Honours are from the Arcane Journal and
 * auto-link from an imported list.
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

  // --- Magic items, Elven weapons & Elven Honours (Arcane Journal) ------------
  // Auto-linked from an imported list's wargear/items/honours: mods apply to the
  // live stat line, rules show as a reminder tag. Points omitted (FAQ-volatile).
  const ITEM_CATEGORIES = [
    ["weapon", "Magic Weapons"],
    ["armour", "Magic Armour"],
    ["talisman", "Talismans"],
    ["standard", "Magic Standards"],
    ["enchanted", "Enchanted Items"],
    ["arcane", "Arcane Items"],
    ["wargear", "Elven Weapons"],
    ["honour", "Elven Honours"],
  ];
  const ITEMS = [
    // Magic Weapons
    { id: "wpn-whitesword", cat: "weapon", name: "The White Sword", mods: {}, rules: ["S+3, AP -2, Magical Attacks, Monster Slayer, Two Handed, Strike Last (infantry/chariot only)"] },
    { id: "wpn-leapinggold", cat: "weapon", name: "The Blade of Leaping Gold", mods: {}, rules: ["Armour Bane (2), Extra Attacks (+D3), Magical Attacks"] },
    { id: "wpn-reaverbow", cat: "weapon", name: "Reaver Bow", mods: {}, rules: ['30" S+1, Magical; counts as Bow of Avelorn; shots = Attacks characteristic, no multi-shot penalty'] },
    { id: "wpn-foebane", cat: "weapon", name: "Foe Bane", mods: {}, rules: ["Magical Attacks; a To Wound roll of 4+ always wounds"] },
    // Magic Armour
    { id: "arm-caledor", cat: "armour", name: "Armour of Caledor", mods: { Sv: 4, Ward: 5 }, rules: ["Full plate armour; 5+ Ward"] },
    { id: "arm-dragonhelm", cat: "armour", name: "Dragon Helm", mods: {}, rules: ["+1 armour value (max 2+); 6+ Ward vs Flaming Attacks"] },
    // Talismans
    { id: "tal-loremaster-cloak", cat: "talisman", name: "The Loremaster's Cloak", mods: {}, rules: ["4+ Ward vs wounds from Magic Missiles (bearer & joined unit)"] },
    { id: "tal-opal", cat: "talisman", name: "Opal Amulet", mods: {}, rules: ["Single use: 2+ Ward against a single wound"] },
    // Magic Standards
    { id: "std-arcane-protection", cat: "standard", name: "Banner of Arcane Protection", mods: {}, rules: ['Unit gains Magic Resistance (-3); friendly units within 6" gain Magic Resistance (-1)'] },
    { id: "std-battle-banner", cat: "standard", name: "Battle Banner", mods: {}, rules: ["+D3 combat result points"] },
    { id: "std-lion", cat: "standard", name: "Lion Standard", mods: {}, rules: ["Unit automatically passes Fear & Terror tests"] },
    { id: "std-ellyrion", cat: "standard", name: "Banner of Ellyrion", mods: {}, rules: ["Unit gains Move Through Cover"] },
    // Enchanted Items
    { id: "ench-nullstone", cat: "enchanted", name: "Null Stone", mods: {}, rules: ["Wizards (friend or foe) in Command range: -1 Casting & Dispel; Ld test to become un-targetable/immune to spells until your next turn"] },
    { id: "ench-cloak-beards", cat: "enchanted", name: "The Cloak of Beards", mods: {}, rules: ["Bearer causes Terror; but other models cannot use the bearer's Leadership"] },
    { id: "ench-seed-rebirth", cat: "enchanted", name: "Seed of Rebirth", mods: {}, rules: ["Regeneration (5+)"] },
    // Arcane Items
    { id: "arc-sigil-asuryan", cat: "arcane", name: "Sigil of Asuryan", mods: {}, rules: ["Single use: auto-dispel one spell with no Dispel roll (not a perfect invocation)"] },
    { id: "arc-annulian", cat: "arcane", name: "Annulian Crystal", mods: {}, rules: ["Once/turn on a successful cast: forget that spell & immediately generate another"] },
    { id: "arc-silvery-wand", cat: "arcane", name: "Silvery Wand", mods: {}, rules: ["Knows one extra spell (does not raise Level)"] },
    // Elven Weapons (granted by Honours / options — Armoury of Ulthuan)
    { id: "war-avelorn", cat: "wargear", name: "Bow of Avelorn", mods: {}, rules: ['30" S, Armour Bane (1), Magical Attacks, Volley Fire'] },
    { id: "war-ceremonial", cat: "wargear", name: "Ceremonial Halberd", mods: {}, rules: ["S+1, AP -1, Armour Bane (1), Fight in Extra Rank, Magical, Two Handed"] },
    { id: "war-chracian-blade", cat: "wargear", name: "Chracian Great Blade", mods: {}, rules: ["S+2, AP -3, Two Handed, Strike Last"] },
    { id: "war-hoeth", cat: "wargear", name: "Sword of Hoeth", mods: {}, rules: ["S+2, AP -2, Magical Attacks, Two Handed"] },
    // Elven Honours (character upgrades)
    { id: "hon-loremaster", cat: "honour", name: "Loremaster", mods: {}, rules: ["High Elf Lords only; Level 1 Wizard (1 spell from Battle/Elementalism/High Magic/Illusion); may take Sword of Hoeth; Ithilmar Armour, Lileath's Blessing, Lore of Saphery; cannot be mounted"] },
    { id: "hon-shadow-stalker", cat: "honour", name: "Shadow Stalker", mods: {}, rules: ["May take Bow of Avelorn; Ambushers, Evasive, Fire & Flee, Move Through Cover, Scouts; no heavy/full plate; cannot be mounted"] },
    { id: "hon-anointed", cat: "honour", name: "Anointed of Asuryan", mods: {}, rules: ["Mount: Flamespyre/Frostheart Phoenix; may take ceremonial halberd; Blessings of Asuryan, Fear, Witness to Destiny; Veteran (replaces Valour of Ages)"] },
    { id: "hon-caledor", cat: "honour", name: "Blood of Caledor", mods: { WS: 1 }, rules: ["Mount: Barded Elven Steed or Sun/Moon/Star Dragon; +1 WS; may take full plate; Dragon Armour, Impetuous"] },
    { id: "hon-chracian", cat: "honour", name: "Chracian Hunter", mods: {}, rules: ["Mount: Lion Chariot of Chrace only; may take Chracian great blade; Lion Cloak, Move Through Cover, Stubborn"] },
    { id: "hon-warden", cat: "honour", name: "Warden of Saphery", mods: {}, rules: ["May take Sword of Hoeth; Deflect Shots, Ithilmar Armour, Killing Blow; cannot be mounted"] },
    { id: "hon-pure-heart", cat: "honour", name: "Pure of Heart", mods: {}, rules: ["Friendly units in Command range may use this character's Leadership; character & joined unit auto-pass Panic tests"] },
    { id: "hon-sea-guard", cat: "honour", name: "Sea Guard", mods: {}, rules: ["Mount: Lothern Skycutter only; may take a warbow; Naval Discipline, Rallying Cry"] },
  ];
  const ITEMS_INDEX = {};
  for (const it of ITEMS) ITEMS_INDEX[norm(it.name)] = it;

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
    ITEMS, ITEMS_INDEX, ITEM_CATEGORIES,
    DURATIONS: W.DURATIONS, norm,
    faction: "high-elf-realms", factionName: "High Elf Realms", theme: "highelves", hasMarks: false, hasGaze: false,
  };
})();
