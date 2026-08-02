/*
 * ChaosTracker26 — Empire of Man faction data (Warhammer: The Old World).
 * Registers window.FACTIONS["empire-of-man"]. Shares generic pieces (STATS,
 * spell building blocks, the universal lores, durations) with the Chaos data.
 * Profiles are from the army reference; armour saves are derived from base
 * wargear (light 6+, heavy 5+, full plate 4+, +1 shield, +1 barding) and are
 * editable in-app. Empire has no Marks or Gaze of the Gods.
 */
(function () {
  "use strict";
  const W = window.WOC_DATA; // shared bits live here (loaded first)
  const norm = W.norm;
  function p(M, WS, BS, S, T, Wd, I, A, Ld, extra) {
    return Object.assign({ M, WS, BS, S, T, W: Wd, I, A, Ld, Sv: null, Ward: null }, extra || {});
  }

  // --- Mounts (bracketed "+N" values add to the rider) ------------------------
  const MOUNTS = [
    { name: "Empire Warhorse", profile: { M: 8, WS: 3, BS: null, S: 3, T: null, W: null, I: 3, A: 1, Ld: null }, note: "Fast Cavalry, Swiftstride" },
    { name: "Barded Warhorse", profile: { M: 7, WS: 3, BS: null, S: 3, T: null, W: null, I: 3, A: 1, Ld: null }, note: "Counter Charge, First Charge, Swiftstride; barding" },
    { name: "Demigryph", profile: { M: 7, WS: 4, BS: null, S: 5, T: null, W: "+1", I: 4, A: 3, Ld: null }, note: "Counter Charge, First Charge, Fear, Swiftstride; barding" },
    { name: "Pegasus", profile: { M: 8, WS: 3, BS: null, S: 4, T: null, W: "+1", I: 4, A: 2, Ld: null }, note: "Counter Charge, First Charge, Fly (10), Swiftstride" },
    { name: "Griffon", profile: { M: 6, WS: 5, BS: null, S: 5, T: "+1", W: "+3", I: 5, A: 4, Ld: null }, note: "Fly (9), Large Target, Stomp Attacks (D3), Swiftstride, Terror" },
    { name: "Imperial Griffon", profile: { M: 6, WS: 5, BS: null, S: 6, T: "+1", W: "+4", I: 4, A: 4, Ld: null }, note: "Fly (9), Large Target, Stomp Attacks (D3+1), Swiftstride, Terror" },
  ];

  // --- Units ------------------------------------------------------------------
  const UNITS = [
    // Characters
    { name: "General of the Empire", category: "Characters", isChar: true, profile: p(4, 5, 5, 4, 4, 3, 5, 3, 10, { Sv: 6 }), rules: ["\"Hold the Line!\"", "Rallying Cry"], note: "Light armour (full plate optional)" },
    { name: "Captain of the Empire", category: "Characters", isChar: true, profile: p(4, 5, 5, 4, 4, 2, 4, 2, 9, { Sv: 6 }), rules: ["\"Hold the Line!\"", "Rallying Cry"] },
    { name: "Grand Master", category: "Characters", isChar: true, profile: p(7, 6, 3, 4, 4, 3, 6, 4, 9, { Sv: 5 }), rules: ["Counter Charge", "First Charge", "Immune to Psychology", "Master of Battle", "Rallying Cry", "Stubborn", "Swiftstride", "Veteran"], note: "Heavy Cavalry (mounted)" },
    { name: "Chapter Master", category: "Characters", isChar: true, profile: p(7, 5, 3, 4, 4, 2, 5, 3, 8, { Sv: 5 }), rules: ["Counter Charge", "First Charge", "Immune to Psychology", "Master of Battle", "Rallying Cry", "Stubborn", "Swiftstride", "Veteran"], note: "Heavy Cavalry (mounted)" },
    { name: "Wizard Lord", category: "Characters", isChar: true, profile: p(4, 4, 3, 3, 4, 3, 3, 2, 8), rules: ["Magical Attacks", "Magic Resistance (-1)"], note: "Wizard" },
    { name: "Master Mage", category: "Characters", isChar: true, profile: p(4, 3, 3, 3, 3, 2, 3, 1, 7), rules: ["Magical Attacks", "Magic Resistance (-1)"], note: "Wizard" },
    { name: "Priest of Sigmar", category: "Characters", isChar: true, profile: p(4, 4, 3, 4, 4, 2, 4, 2, 8, { Sv: 6 }), rules: ["Magical Attacks", "Magic Resistance (-1)", "Prayers of Sigmar"], note: "Priest" },
    { name: "Lector of Sigmar", category: "Characters", isChar: true, profile: p(4, 5, 3, 4, 4, 3, 5, 3, 9, { Sv: 6 }), rules: ["Magical Attacks", "Magic Resistance (-1)", "Prayers of Sigmar"], note: "Priest" },
    { name: "Priest of Ulric", category: "Characters", isChar: true, profile: p(4, 4, 3, 4, 4, 2, 4, 2, 8, { Sv: 6 }), rules: ["Magical Attacks", "Magic Resistance (-1)", "Prayers of Ulric"], note: "Priest" },
    { name: "High Priest of Ulric", category: "Characters", isChar: true, profile: p(4, 5, 3, 4, 4, 3, 5, 3, 9, { Sv: 6 }), rules: ["Magical Attacks", "Magic Resistance (-1)", "Prayers of Ulric"], note: "Priest" },
    { name: "Empire Engineer", category: "Characters", isChar: true, profile: p(4, 3, 4, 3, 3, 2, 3, 1, 7), rules: ["Clouds of Soot & Smoke", "Master of Ballistics"] },
    { name: "Witch Hunter", category: "Characters", isChar: true, profile: p(4, 4, 4, 4, 4, 2, 5, 2, 8, { Sv: 6 }), rules: ["Immune to Psychology", "Killing Blow", "Suffer Not the Unclean to Live"] },
    { name: "Harbinger of Doom", category: "Characters", isChar: true, profile: p(4, 5, 2, 4, 4, 2, 4, 3, 8), rules: ["Feel No Pain", "Furious Charge", "Immune to Psychology", "Impetuous", "Hatred (all enemies)", "Prayer of the Damned", "Unbreakable", "Zealot"] },

    // Core
    { name: "State Troops", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 7, { Sv: 6 }), champ: { A: 2 }, champName: "Sergeant", rules: ["Close Order", "Detachment", "Horde", "Regimental Unit"] },
    { name: "State Missile Troops", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 7, { Sv: 6 }), champ: { BS: 4 }, champName: "Sergeant", rules: ["Close Order", "Detachment", "Regimental Unit"] },
    { name: "Free Company Militia", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 6), champ: { A: 2, Ld: 7 }, champName: "Militia Leader", rules: ["Detachment", "Furious Charge", "Horde", "Impetuous", "Levies", "Open Order", "Warband"] },
    { name: "Empire Archers", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 7), champ: { BS: 4 }, champName: "Marksman", rules: ["Detachment", "Move Through Cover", "Open Order", "Skirmishers", "Vanguard"] },
    { name: "Empire Knights", category: "Core", profile: p(7, 4, 3, 3, 3, 1, 3, 1, 8, { Sv: 3 }), champ: { A: 2 }, champName: "Preceptor", rules: ["Close Order", "Counter Charge", "First Charge", "Swiftstride"], note: "Barded Warhorse. heavy + shield + barding" },
    { name: "Empire Road Wardens", category: "Core", profile: p(8, 3, 4, 3, 3, 1, 3, 1, 7, { Sv: 5 }), champ: { BS: 5 }, champName: "Captain", rules: ["Fast Cavalry", "Fire & Flee", "Open Order", "Skirmishers", "Swiftstride", "Vanguard"], note: "Empire Warhorse" },
    { name: "Pistoliers", category: "Core", profile: p(8, 3, 3, 3, 3, 1, 3, 1, 6, { Sv: 5 }), champ: { BS: 4, Ld: 7 }, champName: "Veteran", rules: ["Counter Charge", "Fast Cavalry", "Fire & Flee", "Impetuous", "Open Order", "Skirmishers", "Swiftstride"], note: "Empire Warhorse" },
    { name: "Outriders", category: "Core", profile: p(8, 3, 4, 3, 3, 1, 3, 1, 7, { Sv: 5 }), champ: { BS: 5 }, champName: "Sharpshooter", rules: ["Fast Cavalry", "Fire & Flee", "Open Order", "Skirmishers", "Swiftstride", "Vanguard"], note: "Empire Warhorse" },

    // Special / Rare
    { name: "Empire Greatswords", category: "Special", profile: p(4, 4, 3, 4, 3, 1, 3, 1, 8, { Sv: 4 }), champ: { WS: 5, A: 2 }, champName: "Count's Champion", rules: ["Close Order", "Furious Charge", "Regimental Unit", "Stubborn"] },
    { name: "Demigryph Knights", category: "Special", profile: p(7, 4, 3, 4, 4, 3, 4, 1, 8, { Sv: 2 }), champ: { A: 2 }, champName: "Preceptor", rules: ["Close Order", "Counter Charge", "First Charge", "Fear", "Swiftstride"], note: "Demigryph: WS4 S5 A3. full plate + barding + shield" },
    { name: "Inner Circle Knights", category: "Special", profile: p(7, 4, 3, 4, 3, 1, 4, 1, 9, { Sv: 2 }), champ: { A: 2 }, champName: "Preceptor", rules: ["Close Order", "Counter Charge", "Drilled", "First Charge", "Inner Circle", "Swiftstride", "Veteran"], note: "Barded Warhorse. full plate + shield + barding" },
    { name: "Teutogen Guard", category: "Special", profile: p(4, 4, 3, 3, 4, 1, 3, 1, 8, { Sv: 4 }), champ: { WS: 5, A: 2 }, champName: "First Knight", rules: ["Blessings of Ulric", "Close Order", "Drilled", "Stubborn", "Veteran"] },
    { name: "Flagellants", category: "Special", profile: p(4, 3, 2, 3, 4, 1, 3, 1, 5), champ: { A: 2 }, champName: "Prophet of Doom", rules: ["Close Order", "Fanatical Zeal", "Feel No Pain", "Furious Charge", "Immune to Psychology", "Impetuous", "Hatred (all enemies)", "Unbreakable"] },
    { name: "Imperial Ogres", category: "Special", profile: p(6, 3, 3, 4, 4, 3, 2, 3, 7, { Sv: 6 }), champ: { BS: 4, A: 4 }, champName: "Ogre Captain", rules: ["Armour Bane (1)", "Close Order", "Fear", "Impact Hits (1)", "Mercenaries", "Motley Crew", "Ogre Charge"] },
    { name: "Great Cannon", category: "Special", isChar: false, monster: true, profile: p(null, null, null, null, 6, 3, null, null, null), rules: ["Skirmishers"], note: "War machine. Gun Crew: WS3 BS3 A3" },
    { name: "Mortar", category: "Special", isChar: false, monster: true, profile: p(null, null, null, null, 6, 3, null, null, null), rules: ["Skirmishers"], note: "War machine. Gun Crew: WS3 BS3 A3" },
    { name: "Helblaster Volley Gun", category: "Rare", isChar: false, monster: true, profile: p(null, null, null, null, 6, 3, null, null, null), rules: ["Skirmishers"], note: "War machine. Gun Crew: WS3 BS3 A3" },
    { name: "Helstorm Rocket Battery", category: "Rare", isChar: false, monster: true, profile: p(null, null, null, null, 6, 3, null, null, null), rules: ["Skirmishers"], note: "War machine. Gun Crew: WS3 BS3 A3" },
    { name: "Steam Tank", category: "Rare", isChar: false, monster: true, profile: p(4, null, null, 6, 7, 10, null, null, null, { Sv: 3 }), rules: ["Close Order", "Grinding Wheels", "Immune to Psychology", "Impact Hits (D6+1)", "Large Target", "Steam Power", "Stomp Attacks (D3+1)", "Temperamental", "Terror", "Unbreakable"], note: "Chariot. Engineer Commander: BS4" },
    { name: "Empire War Wagon", category: "Rare", isChar: false, monster: true, profile: p(7, null, null, 5, 5, 6, null, null, null, { Sv: 3 }), rules: ["Close Order", "Crushing Weight", "Impact Hits (D6+1)", "Large Target", "Stable Firing Platform", "Stomp Attacks (D3+1)"], note: "Chariot. Crew WS3 BS3; Barded Warhorses" },
    { name: "War Altar of Sigmar", category: "Rare", isChar: false, monster: true, profile: p(7, null, null, 5, 5, 5, null, null, null, { Sv: 4 }), rules: ["Close Order", "First Charge", "Holy Fervour", "Impact Hits (D6+1)", "Large Target", "Magic Resistance (-2)", "Stubborn", "Symbol of Might", "Terror", "Witch Bane"], note: "Chariot" },

    // Nuln (City-state of Nuln) variants
    { name: "Nuln State Troops", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 7, { Sv: 6 }), champ: { A: 2 }, champName: "Sergeant", rules: ["Close Order", "Horde", "Nuln State Troops", "Regimental Unit"] },
    { name: "Nuln Veteran State Troops", category: "Core", profile: p(4, 4, 3, 3, 3, 1, 3, 1, 7, { Sv: 6 }), champ: { A: 2 }, champName: "Veteran Sergeant", rules: ["Close Order", "Horde", "Nuln State Troops", "Regimental Unit", "Veteran"] },
    { name: "Nuln State Missile Troops", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 7), champ: { BS: 4 }, champName: "Sergeant", rules: ["Close Order", "Detachment", "Nuln State Troops"] },
    { name: "Nuln Swordsmen", category: "Core", profile: p(4, 3, 3, 3, 3, 1, 3, 1, 7, { Sv: 5 }), champ: { A: 2 }, champName: "Sergeant", rules: ["Close Order", "Detachment", "Horde", "Nuln State Troops"] },
    { name: "Veteran State Troops", category: "Core", profile: p(4, 4, 3, 3, 3, 1, 3, 1, 7, { Sv: 6 }), champ: { A: 2 }, champName: "Veteran Sergeant", rules: ["Close Order", "Detachment", "Horde", "Regimental Unit", "Veteran"] },

    // Named characters
    { name: "General Hans von Löwenhacke", category: "Characters", isChar: true, profile: p(4, 6, 5, 4, 4, 3, 4, 4, 10, { Sv: 4 }), rules: ["\"Hold the Line!\"", "Mercenary Commander", "Rallying Cry", "Strategic Mastery", "Stubborn"], note: "Named. Full plate. Judgement, Griffon Helm" },
    { name: "Harald Gemunsen", category: "Characters", isChar: true, profile: p(7, 7, 3, 4, 4, 3, 6, 4, 9, { Sv: 4 }), rules: ["Counter Charge", "First Charge", "Grand Master of the Knights Panther", "Hatred (Chaos, Beastmen & Daemons)", "Immune to Psychology", "Magic Resistance (-1)", "Master of Battle", "Rallying Cry", "Skilled Duellist", "Stubborn", "Swiftstride", "Veteran"], note: "Named. Full plate. Beast Reaver. Barded Warhorse" },
  ];

  // --- Lores (shared universal lores + Empire-only, prayers to be filled) ------
  const LORES = {
    "battle-magic": W.LORES["battle-magic"],
    "daemonology": W.LORES["daemonology"],
    "dark-magic": W.LORES["dark-magic"],
    "elementalism": [],
    "illusion": [],
    "necromancy": [],
    "prayers-sigmar": [],
    "prayers-ulric": [],
  };
  const LORE_NAMES = {
    "battle-magic": "Battle Magic", "daemonology": "Daemonology", "dark-magic": "Dark Magic",
    "elementalism": "Elementalism", "illusion": "Illusion", "necromancy": "Necromancy",
    "prayers-sigmar": "Prayers of Sigmar", "prayers-ulric": "Prayers of Ulric",
  };

  // Build indexes.
  const UNIT_INDEX = {};
  for (const u of UNITS) { UNIT_INDEX[norm(u.name)] = u; UNIT_INDEX[norm(u.name).replace(/s$/, "")] = u; }
  const MOUNT_INDEX = {};
  for (const m of MOUNTS) { MOUNT_INDEX[norm(m.name)] = m; MOUNT_INDEX[norm(m.name).replace(/s$/, "")] = m; }

  window.FACTIONS = window.FACTIONS || {};
  window.FACTIONS["empire-of-man"] = {
    STATS: W.STATS,
    UNITS, UNIT_INDEX, MOUNTS, MOUNT_INDEX,
    MARKS: {}, GAZE_REWARDS: [],
    SPELL_EFFECTS: W.SPELL_EFFECTS,
    LORES, LORE_NAMES,
    ITEMS: [], ITEMS_INDEX: {}, ITEM_CATEGORIES: [],
    DURATIONS: W.DURATIONS, norm,
    faction: "empire-of-man", factionName: "The Empire", theme: "empire", hasMarks: false, hasGaze: false,
  };
})();
