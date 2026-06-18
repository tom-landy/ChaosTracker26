/*
 * Importer for Old World Builder army lists.
 *
 * Primary path: OWB's native JSON export (.owb.json). It has a precise shape we
 * can read exactly — model counts, marks, mounts, command, magic items and
 * special rules are all structured fields.
 * Fallback path: plain text paste, scanned line-by-line with heuristics.
 *
 * Either way, every unit produced is fully editable afterwards.
 */
(function () {
  "use strict";
  const D = window.WOC_DATA;

  // --- shared helpers -------------------------------------------------------
  let _uid = 0;
  function newUnit() {
    return {
      id: "u" + Date.now().toString(36) + (_uid++),
      name: "",
      category: "Core",
      isChar: false,
      models: 1,
      modelsLost: 0,
      profile: { M: "", WS: "", BS: "", S: "", T: "", W: "", I: "", A: "", Ld: "", Sv: null, Ward: null },
      width: 5,
      woundsLost: 0,
      mark: null,
      mount: null,
      mountProfile: null,   // secondary stat line when mounted (editable)
      mountWoundsLost: 0,
      lores: [],            // lore ids available to this caster
      activeLore: null,     // the lore chosen in the list
      options: [],        // equipment / command / wargear strings
      baseRules: [],      // static special rules from the list
      rewards: [],        // Gaze of the Gods
      items: [],          // gifts / magic items / traits (by id)
      effects: [],        // active spells/buffs
      notes: "",
      matched: false,
      rawLines: [],
    };
  }

  function cleanName(s) {
    return String(s || "").replace(/\{[^}]*\}/g, "").replace(/\s{2,}/g, " ").trim();
  }

  function matchUnit(name) {
    const n = D.norm(name);
    if (!n) return null;
    if (D.UNIT_INDEX[n]) return D.UNIT_INDEX[n];
    if (D.UNIT_INDEX[n.replace(/s$/, "")]) return D.UNIT_INDEX[n.replace(/s$/, "")];
    let best = null, bestLen = 0;
    for (const u of D.UNITS) {
      const un = D.norm(u.name), uns = un.replace(/s$/, "");
      if ((n.includes(un) || n.includes(uns)) && un.length > bestLen) { best = u; bestLen = un.length; }
    }
    return best;
  }

  // Apply a matched stat-line. Does NOT set category — the list's own placement
  // (which army-composition slot the unit was taken in) always wins over our default.
  function applyMatch(unit, def) {
    unit.name = def.name;
    unit.isChar = !!def.isChar;
    unit.profile = Object.assign({}, def.profile);
    unit.matched = true;
    if (def.note) unit.notes = def.note;
    if (def.isChar || def.monster) unit.width = 1;
  }

  // Match option/wargear strings against the known items library, returning ids.
  function linkItems(options) {
    const ids = [];
    for (const opt of options || []) {
      const it = D.ITEMS_INDEX && D.ITEMS_INDEX[D.norm(opt)];
      if (it && ids.indexOf(it.id) === -1) ids.push(it.id);
    }
    return ids;
  }

  function markKey(name) {
    const t = String(name || "").toLowerCase();
    if (t.includes("undivided")) return "undivided";
    for (const k of ["khorne", "nurgle", "slaanesh", "tzeentch"]) if (t.includes(k)) return k;
    return null;
  }

  // --- JSON path ------------------------------------------------------------
  const CAT_MAP = {
    characters: "Characters", core: "Core", special: "Special",
    rare: "Rare", mercenaries: "Allies", allies: "Allies",
  };

  function activeNames(arr) {
    return (arr || []).filter((x) => x && x.active && x.name_en && !/^on foot$/i.test(x.name_en))
      .map((x) => cleanName(x.name_en));
  }

  function selectedNames(arr) {
    const out = [];
    for (const grp of arr || []) {
      if (!grp) continue;
      // items: grp.selected; command entries: banner under grp.magic.selected
      const lists = [grp.selected, grp.magic && grp.magic.selected];
      for (const list of lists) for (const sel of list || []) if (sel && sel.name_en) out.push(cleanName(sel.name_en));
    }
    return out;
  }

  function unitFromEntry(entry, category) {
    const u = newUnit();
    u.category = category;
    const name = cleanName(entry.name_en || entry.name || "Unit");
    u.models = typeof entry.strength === "number" && entry.strength > 0 ? entry.strength : 1;
    const def = matchUnit(name);
    if (def) applyMatch(u, def); else u.name = name;
    if (def && (def.isChar || def.monster)) u.models = 1;

    // Mark: nested inside the "Mark of Chaos" option group, or a top-level option.
    for (const opt of entry.options || []) {
      if (opt && Array.isArray(opt.options)) {
        const chosen = opt.options.find((o) => o.active);
        if (chosen) { const k = markKey(chosen.name_en); if (k) u.mark = k; }
      } else if (opt && opt.active && markKey(opt.name_en)) {
        u.mark = markKey(opt.name_en);
      }
    }

    // Mount (rider keeps own profile; mount shown as a tag/note for now).
    const mount = (entry.mounts || []).find((m) => m && m.active && !/^on foot$/i.test(m.name_en || ""));
    if (mount) {
      u.mount = cleanName(mount.name_en);
      const mdef = D.MOUNT_INDEX[D.norm(u.mount)] || D.MOUNT_INDEX[D.norm(u.mount).replace(/s$/, "")];
      if (mdef) { u.mountProfile = Object.assign({}, mdef.profile); if (mdef.note) u.mountNote = mdef.note; }
    }

    // Wargear: active equipment, armour, simple options (e.g. Shields), wizard level.
    const wargear = [];
    wargear.push(...activeNames(entry.equipment));
    wargear.push(...activeNames(entry.armor));
    for (const opt of entry.options || []) {
      if (opt && Array.isArray(opt.options)) {
        // capture chosen non-mark sub-option (e.g. wizard level)
        const chosen = opt.options.find((o) => o.active);
        if (chosen && !markKey(chosen.name_en)) wargear.push(cleanName(chosen.name_en));
      } else if (opt && opt.active && opt.name_en && !/mark of chaos/i.test(opt.name_en)) {
        wargear.push(cleanName(opt.name_en));
      }
    }

    // Command (Champion / Standard / Musician / General / BSB).
    const command = activeNames(entry.command);

    // Magic items, gifts, chaotic traits + banners chosen under command.
    const magic = selectedNames(entry.items).concat(selectedNames(entry.command));

    u.options = wargear.concat(command).concat(magic).filter(Boolean);

    // Auto-link known gifts / magic items / traits to their effects.
    u.items = linkItems(u.options);

    // Static special rules → tags.
    if (entry.specialRules && entry.specialRules.name_en) {
      u.baseRules = entry.specialRules.name_en.split(",").map((s) => cleanName(s)).filter(Boolean);
    }
    // Lores available to this caster.
    if (Array.isArray(entry.lores)) u.lores = entry.lores.slice();
    if (entry.activeLore) u.activeLore = entry.activeLore;

    return u;
  }

  function fromJson(obj) {
    const meta = { name: obj.name || "My Army", points: obj.points != null ? String(obj.points) : "" };
    const units = [];
    for (const key in CAT_MAP) {
      for (const entry of obj[key] || []) units.push(unitFromEntry(entry, CAT_MAP[key]));
    }
    return { meta, units, sawAnyHeader: true, source: "json" };
  }

  // --- text fallback path ---------------------------------------------------
  const CATEGORY_WORDS = [
    { re: /\b(lords?|characters?)\b/i, cat: "Characters" },
    { re: /\bheroes?\b/i, cat: "Characters" },
    { re: /\bcore\b/i, cat: "Core" },
    { re: /\bspecial\b/i, cat: "Special" },
    { re: /\brare\b/i, cat: "Rare" },
  ];
  const stripBullet = (l) => l.replace(/^[\s>*•\-–·]+/, "").trim();
  function takeCount(name) {
    const m = name.match(/^(\d+)\s*[xX]?\s+(.*)$/);
    return m ? { count: parseInt(m[1], 10), rest: m[2].trim() } : { count: 1, rest: name };
  }
  function stripPoints(name) {
    return name
      .replace(/[\[(]\s*\d+\s*(?:pts?|points?)?\s*[\])]/gi, "")
      .replace(/[-–—]?\s*\d+\s*(?:pts?|points?)\b/gi, "")
      .replace(/\s{2,}/g, " ").replace(/[\s:,-]+$/, "").trim();
  }
  function looksLikeHeader(line) {
    const bare = line.replace(/[+=#~]/g, "").trim();
    if (!bare) return null;
    for (const c of CATEGORY_WORDS) if (c.re.test(bare) && bare.split(/\s+/).length <= 4) return c.cat;
    return null;
  }
  function looksLikeUnit(line) {
    if (/^\d+\s*[xX]?\s+\S/.test(line)) return true;
    if (/\d+\s*(pts?|points?)\b/i.test(line)) return true;
    if (/[\[(]\s*\d+\s*[\])]/.test(line)) return true;
    return !!matchUnit(stripPoints(line));
  }
  function fromText(text) {
    const lines = String(text || "").split(/\r?\n/);
    const units = [];
    let meta = { name: "", points: "" }, current = null, category = "Core", sawHeader = false;
    for (let raw of lines) {
      const line = stripBullet(raw);
      if (!line) continue;
      if (!meta.name && /\d{3,5}/.test(line) && !looksLikeUnit(line)) {
        const m = line.match(/(\d{3,5})/);
        meta.points = m ? m[1] : "";
        meta.name = line.replace(/\++/g, "").replace(/[\[(].*$/, "").trim() || "My Army";
        continue;
      }
      const header = looksLikeHeader(line);
      if (header) { category = header; sawHeader = true; continue; }
      const indented = /^\s/.test(raw) || /^[>*•\-–·]/.test(raw.trim());
      if (current && (indented || !looksLikeUnit(line))) {
        current.options.push(stripPoints(line));
        const mk = markKey(line); if (mk) current.mark = mk;
        continue;
      }
      const { count, rest } = takeCount(line);
      const cleanNm = stripPoints(rest);
      if (!cleanNm) continue;
      current = newUnit();
      current.category = category;
      current.models = count;
      const def = matchUnit(cleanNm);
      if (def) { applyMatch(current, def); if (!sawHeader) current.category = def.category; }
      else current.name = cleanNm;
      const mk = markKey(line); if (mk) current.mark = mk;
      units.push(current);
    }
    if (!meta.name) meta.name = "My Army";
    return { meta, units, source: "text" };
  }

  // --- unified entry --------------------------------------------------------
  function parse(input) {
    if (input && typeof input === "object") return fromJson(input);
    const t = String(input || "").trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        const obj = JSON.parse(t);
        return fromJson(Array.isArray(obj) ? { core: obj } : obj);
      } catch (e) { /* fall through to text */ }
    }
    return fromText(t);
  }

  window.WOC_PARSER = { parse, fromJson, fromText, matchUnit, newUnit, linkItems };
})();
