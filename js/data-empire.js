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
    // Lore of Elementalism (core rulebook) — full 7 spells.
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
    // Lore of Illusion (core rulebook) — full 7 spells.
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
    // Lore of Necromancy (core rulebook) — full 7 spells.
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
    // Prayers of Sigmar (Warrior Priests) — invoked on a Leadership test.
    "prayers-sigmar": [
      { id: "psig-1", name: "Hammer of Sigmar", type: "Prayer", cv: "Ld test", range: "Command", kind: "augment",
        mods: {}, rules: ["Re-roll natural 1s To Hit & To Wound in combat (self, mount & one unit in Command range)"], duration: "Until start of your next turn" },
      { id: "psig-2", name: "Shield of Faith", type: "Prayer", cv: "Ld test", range: "Command", kind: "augment",
        mods: {}, rules: ["5+ Ward vs wounds in the Shooting phase (self & one unit in Command range)"], duration: "Until start of your next turn" },
      { id: "psig-3", name: "Soulfire", type: "Prayer", cv: "Ld test", range: "Combat", kind: "damage", instant: true,
        mods: {}, rules: ["Enemy in combat takes D6 hits at S3, AP -2, Flaming & Magical Attacks"] },
    ],
    // Prayers of Ulric (Warrior Priests of Ulric) — invoked on a Leadership test.
    "prayers-ulric": [
      { id: "pulr-1", name: "Battle Howl", type: "Prayer", cv: "Ld test", range: "Command", kind: "augment",
        mods: {}, rules: ["+D3 to Charge rolls (self & one infantry/cavalry unit in Command range)"], duration: "Until start of your next turn" },
      { id: "pulr-2", name: "Winter's Chill", type: "Prayer", cv: "Ld test", range: "Self", kind: "augment",
        mods: {}, rules: ["Enemies attacking must re-roll natural 6s To Hit (self, mount & joined unit)"], duration: "Until start of your next turn" },
      { id: "pulr-3", name: "Wrath of Winter", type: "Prayer", cv: "Ld test", range: "Self", kind: "augment",
        mods: {}, rules: ["Gain Multiple Wounds (2) (self, mount & joined unit)"], duration: "Until start of your next turn" },
    ],
  };
  const LORE_NAMES = {
    "battle-magic": "Battle Magic", "daemonology": "Daemonology", "dark-magic": "Dark Magic",
    "elementalism": "Elementalism", "illusion": "Illusion", "necromancy": "Necromancy",
    "prayers-sigmar": "Prayers of Sigmar", "prayers-ulric": "Prayers of Ulric",
  };

  // --- Empire magic items (Forces of Fantasy) --------------------------------
  // Auto-linked from an imported list's wargear/options: mods apply to the live
  // stat line, rules show as a reminder tag. Points omitted (they change with FAQs).
  const ITEM_CATEGORIES = [
    ["weapon", "Magic Weapons"],
    ["armour", "Magic Armour"],
    ["talisman", "Talismans"],
    ["standard", "Magic Standards"],
    ["enchanted", "Enchanted Items"],
    ["arcane", "Arcane Items"],
    ["engineer", "Empire Weapons"],
  ];
  const ITEMS = [
    // Magic Weapons
    { id: "wpn-runefang", cat: "weapon", name: "Runefang", mods: {}, rules: ["AP -2, Magical Attacks, Strike First; To Wound roll of 2+ always wounds"] },
    { id: "wpn-helsturm", cat: "weapon", name: "Mace of Helsturm", mods: {}, rules: ["Magical Attacks; double-handed = S10, AP -5, Multiple Wounds (D6), one attack only"] },
    { id: "wpn-justice", cat: "weapon", name: "Sword of Justice", mods: {}, rules: ["AP -1, Armour Bane (1), Magical, Multiple Wounds (2); re-roll failed To Wound"] },
    { id: "wpn-dragonbow", cat: "weapon", name: "Dragon Bow", mods: {}, rules: ['36" S6, AP -2, Magical Attacks, Multiple Wounds (2) (Commanders only)'] },
    // Magic Armour
    { id: "arm-fortune", cat: "armour", name: "Armour of Fortune", mods: { Sv: 5, Ward: 6 }, rules: ["Heavy armour; 6+ Ward; immune to Killing Blow"] },
    { id: "arm-tarnus", cat: "armour", name: "Armour of Tarnus", mods: { Sv: 6, Ward: 5 }, rules: ["Light armour (Wizards, no penalty); 5+ Ward"] },
    // Talismans
    { id: "tal-whitecloak", cat: "talisman", name: "The White Cloak", mods: { Ward: 5 }, rules: ["5+ Ward; 3+ Ward vs Flaming Attacks"] },
    { id: "tal-jade", cat: "talisman", name: "Jade Amulet", mods: {}, rules: ["Immune to Killing Blow"] },
    // Magic Standards
    { id: "std-imperial", cat: "standard", name: "Imperial Banner", mods: {}, rules: ["Friendly units in Command range roll 3D6 & discard the highest for Fear/Panic/Terror tests"] },
    { id: "std-griffon", cat: "standard", name: "Griffon Standard", mods: {}, rules: ["Unit claims +2 Rank Bonus per extra rank (instead of +1)"] },
    { id: "std-gleaming", cat: "standard", name: "The Gleaming Pennant", mods: {}, rules: ["Single use: re-roll one failed Leadership test (not a Break test)"] },
    { id: "std-duty", cat: "standard", name: "Banner of Duty", mods: {}, rules: ["Re-roll failed Rally tests"] },
    // Enchanted Items
    { id: "ench-laurels", cat: "enchanted", name: "Laurels of Victory", mods: {}, rules: ["Each unsaved wound caused by the bearer (not their mount) is worth 2 combat result points"] },
    { id: "ench-silverhorn", cat: "enchanted", name: "The Silver Horn", mods: {}, rules: ["Swiftstride characters only: re-roll the Swiftstride D6 (bearer & joined unit)"] },
    { id: "ench-shroud", cat: "enchanted", name: "Shroud of Iron", mods: {}, rules: ["6+ Ward vs wounds from non-magical templates (bearer & joined unit)"] },
    // Arcane Items
    { id: "arc-ashur", cat: "arcane", name: "Book of Ashur", mods: {}, rules: ['+3" Dispel range; +1 to Casting/Dispel unless a natural double is rolled'] },
    { id: "arc-familiar", cat: "arcane", name: "Wizard's Familiar", mods: {}, rules: ["0-1 per Wizard; +1 to Dispel rolls"] },
    { id: "arc-staff", cat: "arcane", name: "Wizard's Staff", mods: {}, rules: ["0-1 per Wizard; +1 to Casting for Assailment spells & Magic Missiles"] },
    // Weapons of the Empire (Engineer special weapons)
    { id: "eng-blunderbuss", cat: "engineer", name: "Grenade Launching Blunderbuss", mods: {}, rules: ['24" S4, AP -2, Cumbersome, Ponderous; a hit causes D3+1 hits'] },
    { id: "eng-hochland", cat: "engineer", name: "Hochland Long Rifle", mods: {}, rules: ['36" S4, AP -1, Armour Bane (1), Cumbersome, Ponderous; may target a specific model'] },
    { id: "eng-pigeon", cat: "engineer", name: "Pigeon Bombs", mods: {}, rules: ['Instead of shooting: pick an enemy within 24" and roll on the Pigeon Bomb table'] },
  ];
  const ITEMS_INDEX = {};
  for (const it of ITEMS) ITEMS_INDEX[norm(it.name)] = it;

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
    ITEMS, ITEMS_INDEX, ITEM_CATEGORIES,
    DURATIONS: W.DURATIONS, norm,
    faction: "empire-of-man", factionName: "The Empire", theme: "empire", hasMarks: false, hasGaze: false,
  };
})();
