/*
 * ChaosTracker26 — main app logic.
 * Plain DOM, no framework, no build step. State persists to localStorage and
 * every visible stat is derived live from: base profile + mark + Gaze of the
 * Gods rewards + active spell effects + casualties.
 */
(function () {
  "use strict";
  let D = window.WOC_DATA; // active faction's data (reassigned per active army)
  const P = window.WOC_PARSER;
  function factionData(f) { return (window.FACTIONS && window.FACTIONS[f]) || window.WOC_DATA; }
  const STORE_KEY = "chaostracker26.v1";
  const APP_VERSION = "v58"; // shown in the footer; matches the service-worker cache
  const APP_DATE = "2026-08-02"; // release date shown in the footer for a quick freshness check
  const GAZE_VERSION = 2; // bump to roll out a corrected default Gaze table
  const MOUNT_VERSION = 2; // bump to re-apply corrected mount profiles to saved armies
  const UNIT_VERSION = 4;  // bump to re-apply corrected unit profiles to saved armies
  const ITEMS_VERSION = 3; // bump to re-link items/traits from wargear on saved armies

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function rawLoad() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }
  function newId() { return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function newScoring() { return { event: "", scale: "wdl3", bonuses: { painting: "", sports: "" }, games: [] }; }
  function newArmy(name) { return { id: newId(), meta: { name: name || "My Army", points: "" }, units: [], turn: 1, faction: "warriors-of-chaos", scoring: newScoring() }; }

  // ---- state: a database of armies (all client-side in localStorage) --------
  let DB = (function migrate(raw) {
    if (raw && raw.schema === 2 && Array.isArray(raw.armies) && raw.armies.length) return raw;
    if (raw && (raw.units || raw.meta)) { // old single-army save -> wrap as army #1
      const a = { id: newId(), meta: raw.meta || { name: "My Army", points: "" }, units: raw.units || [], turn: raw.turn || 1 };
      return { schema: 2, activeId: a.id, armies: [a], gaze: raw.gaze, gazeVersion: raw.gazeVersion, mountVersion: raw.mountVersion, unitVersion: raw.unitVersion, itemsVersion: raw.itemsVersion };
    }
    const a = newArmy("My Army");
    return { schema: 2, activeId: a.id, armies: [a] };
  })(rawLoad());

  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) {} }
  function activeArmy() { return DB.armies.find((a) => a.id === DB.activeId) || DB.armies[0]; }
  let state = activeArmy(); // the army currently being viewed/edited

  // Normalise every army, then run shared/data migrations across all of them.
  for (const a of DB.armies) { if (!a.id) a.id = newId(); if (!a.meta) a.meta = { name: "My Army", points: "" }; if (!a.units) a.units = []; if (!a.turn) a.turn = 1; if (!a.faction) a.faction = "warriors-of-chaos"; if (!a.scoring) a.scoring = newScoring(); if (!a.scoring.bonuses) a.scoring.bonuses = { painting: "", sports: "" }; if (!Array.isArray(a.scoring.games)) a.scoring.games = []; for (const u of a.units) { if (u.fleeing && !u.status) { u.status = "fleeing"; delete u.fleeing; } } }
  if (!DB.activeId || !activeArmy()) DB.activeId = DB.armies[0].id;
  if (!DB.gaze || DB.gazeVersion !== GAZE_VERSION) { DB.gaze = clone(D.GAZE_REWARDS); DB.gazeVersion = GAZE_VERSION; save(); }
  if (DB.unitVersion !== UNIT_VERSION) {
    for (const a of DB.armies) { const fd = factionData(a.faction); for (const u of a.units) {
      const def = P.matchUnit(u.name, fd);
      if (def) { u.profile = clone(def.profile); u.isChar = !!def.isChar; u.notes = def.note || ""; }
    } }
    DB.unitVersion = UNIT_VERSION; save();
  }
  if (DB.mountVersion !== MOUNT_VERSION) {
    for (const a of DB.armies) { const fd = factionData(a.faction); for (const u of a.units) {
      if (!u.mount) continue;
      const mdef = fd.MOUNT_INDEX[fd.norm(u.mount)] || fd.MOUNT_INDEX[fd.norm(u.mount).replace(/s$/, "")];
      if (mdef) { u.mountProfile = clone(mdef.profile); u.mountNote = mdef.note || null; }
    } }
    DB.mountVersion = MOUNT_VERSION; save();
  }
  if (DB.itemsVersion !== ITEMS_VERSION) {
    for (const a of DB.armies) { const fd = factionData(a.faction); for (const u of a.units) { if (!u.items || !u.items.length) u.items = P.linkItems(u.options || [], fd); } }
    DB.itemsVersion = ITEMS_VERSION; save();
  }
  state = activeArmy();

  // ---- derived stats -------------------------------------------------------
  // A mount value of "+N" is added to the rider; a plain number is the mount's
  // own stat (only Movement folds into the model). Returns a profile with the
  // mount folded in, so mount contributions are part of the model's baseline.
  function mountAdd(v) {
    if (typeof v !== "string") return null;
    const m = v.replace(/[()\s]/g, "").match(/^\+(\d+)$/);
    return m ? parseInt(m[1], 10) : null;
  }
  function foldMount(profile, mp) {
    const out = Object.assign({}, profile);
    if (!mp) return out;
    // model moves at the mount's Movement (skip if the rider's M is random text)
    if (mp.M != null && mp.M !== "" && mountAdd(mp.M) == null && !isNaN(parseInt(mp.M, 10))) out.M = parseInt(mp.M, 10);
    for (const k of D.STATS) {
      const add = mountAdd(mp[k]);
      if (add != null) out[k] = (parseInt(out[k], 10) || 0) + add;
    }
    return out;
  }

  // Sum numeric mods from mark + rewards + effects onto the (mount-folded) base.
  // Non-numeric characteristics (e.g. "D3", "2D6+1") are passed through untouched.
  // Chaos Armour is a Ward save — read its (X+) value from the unit's rules.
  function chaosArmourWard(unit) {
    const def = P.matchUnit(unit.name, D);
    const txt = [].concat((def && def.rules) || [], unit.baseRules || []).join(" ");
    const m = txt.match(/chaos armour[^(]*\((\d)\s*\+\)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function effective(unit, baseOverride) {
    const prof = baseOverride ? Object.assign({}, unit.profile, baseOverride) : unit.profile;
    const base = foldMount(prof, unit.mountProfile);
    const caw = chaosArmourWard(unit); // Chaos Armour ward is part of the baseline
    if (caw != null) base.Ward = bestSave(base.Ward, caw);
    const eff = {};
    for (const k of D.STATS) {
      if (isRandom(base[k])) { eff[k] = base[k]; continue; } // keep dice expressions intact
      const n = parseInt(base[k], 10);
      eff[k] = isNaN(n) ? (base[k] == null ? "" : base[k]) : n;
    }
    eff.Sv = base.Sv; eff.Ward = base.Ward;
    const rules = [];
    const sources = [];

    function applyMods(mods, rls, label) {
      if (mods) for (const k in mods) {
        if (k === "Ward") { eff.Ward = bestSave(eff.Ward, mods.Ward); }
        else if (k === "Sv") { eff.Sv = bestSave(eff.Sv, mods.Sv); }
        else if (k === "SvMod") { eff.Sv = worsenSave(eff.Sv, mods.SvMod); }
        else if (k === "WardMod") { eff.Ward = worsenSave(eff.Ward, mods.WardMod); }
        else if (typeof eff[k] === "number") eff[k] = eff[k] + mods[k];
      }
      if (rls) for (const r of rls) rules.push({ text: r, src: label });
    }

    if (unit.mark && D.MARKS[unit.mark]) {
      const m = D.MARKS[unit.mark];
      applyMods(m.mods, m.rules, "mark");
      sources.push(m.name);
    }
    for (const rid of unit.rewards || []) {
      const r = findReward(rid);
      if (r) applyMods(r.mods, r.rules, "gaze");
    }
    for (const iid of unit.items || []) {
      const it = findItem(iid);
      if (!it) continue;
      if (it.id === "trait-unnatural-fortitude" || it.id === "trait-longstriders") {
        // only applies if the model isn't wearing heavy or full plate armour
        const heavy = /heavy armour|full plate/i.test((unit.options || []).join(" "));
        applyMods(heavy ? {} : it.mods, it.rules, "item");
      } else {
        applyMods(it.mods, it.rules, "item");
      }
    }
    for (const ef of unit.effects || []) {
      applyMods(ef.mods, ef.rules, ef.kind === "hex" ? "hex" : "aug");
    }
    // Characteristics cap at 10 (and never go negative); skip random/text values.
    for (const k of ["WS", "BS", "S", "T", "W", "I", "A", "Ld"]) {
      if (typeof eff[k] === "number") eff[k] = Math.max(0, Math.min(10, eff[k]));
    }
    return { eff, base, rules, sources };
  }

  function bestSave(a, b) {
    // saves: lower is better; null means none.
    if (a == null) return b;
    if (b == null) return a;
    return Math.min(a, b);
  }
  // Worsen a save by a penalty (higher number); a save past 6+ is lost entirely.
  function worsenSave(sv, penalty) {
    if (sv == null) return null; // no save to worsen
    const v = sv + (penalty || 0);
    return v > 6 ? null : v;
  }
  function num(v) { const n = parseInt(v, 10); return isNaN(n) ? "" : n; }
  // Random characteristic helpers (e.g. "2D6+1", "D6", "D3", "3D6").
  function isRandom(v) { return typeof v === "string" && /[dD]\d/.test(v); }
  function rollExpr(s) {
    let total = 0, any = false;
    String(s).replace(/(\d*)\s*[dD](\d+)\s*([+-]\s*\d+)?/g, (m, n, sides, mod) => {
      any = true;
      const count = n ? parseInt(n, 10) : 1;
      for (let i = 0; i < count; i++) total += 1 + Math.floor(Math.random() * parseInt(sides, 10));
      if (mod) total += parseInt(mod.replace(/\s/g, ""), 10);
      return m;
    });
    return any ? total : null;
  }
  // Compulsory rules to remind about at the start of a turn.
  const REMINDERS = [
    [/stupidity/i, "Stupidity test"],
    [/random movement/i, "Random Movement"],
    [/\bfrenzy\b/i, "Frenzy (restrain or charge)"],
    [/impetuous/i, "Impetuous (must charge if able)"],
    [/unstable/i, "Unstable"],
    [/wilful beast/i, "Wilful Beast (monster reaction)"],
    [/animosity/i, "Animosity"],
  ];
  function findReward(rid) {
    if (typeof rid === "object") return rid; // inline custom reward
    return DB.gaze.find((r) => r.id === rid);
  }
  function findItem(iid) {
    if (typeof iid === "object") return iid; // inline custom item
    return D.ITEMS.find((i) => i.id === iid);
  }

  function modelsRemaining(u) { return Math.max(0, (u.models || 0) - (u.modelsLost || 0)); }
  function unitDead(u) {
    const w = num((u.profile && u.profile.W)) || 1;
    const single = u.isChar || u.models <= 1;
    return modelsRemaining(u) <= 0 || (single && (w + sumMountW(u) - (u.woundsLost || 0)) <= 0);
  }
  function sumMountW(u) { const a = u.mountProfile && mountAdd(u.mountProfile.W); return a || 0; }
  // Status helpers (VP-relevant): gone = destroyed or fled off the table.
  function unitGone(u) { return u.status === "dead" || u.status === "fled" || unitDead(u); }
  function unitQuarter(u) {
    const single = u.isChar || u.models <= 1;
    if (!single) return modelsRemaining(u) > 0 && modelsRemaining(u) <= Math.floor(u.models * 0.25);
    const w = (num((u.profile && u.profile.W)) || 1) + sumMountW(u);
    return w > 1 && (w - (u.woundsLost || 0)) > 0 && (w - (u.woundsLost || 0)) <= Math.floor(w * 0.25);
  }
  function hasCmd(u, re) { return re.test((u.options || []).join(" ")); }

  // Build a link to a special rule's page on tow.whfb.app (parentheticals stripped).
  function ruleLookupUrl(name) {
    const slug = String(name || "")
      .replace(/\([^)]*\)/g, "")
      .replace(/\{[^}]*\}/g, "")
      .trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return "https://tow.whfb.app/special-rules/" + slug;
  }

  // ---- rendering -----------------------------------------------------------
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    for (const c of [].concat(children || [])) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }

  let view = "roster"; // "roster" | "scoring"
  function setView(v) { view = v; render(); }

  function render() {
    D = factionData(state.faction); // switch data + theme to the active army's faction
    document.body.setAttribute("data-theme", D.theme || "chaos");
    $("#armyPoints").textContent = state.meta.points ? state.meta.points + " pts" : "";
    const tb = $("#turnNum"); if (tb) tb.textContent = state.turn || 1;
    const pv = $("#btnPrevTurn"); if (pv) pv.disabled = (state.turn || 1) <= 1;
    const sel = $("#armySel");
    if (sel) {
      sel.innerHTML = "";
      for (const a of DB.armies) sel.append(el("option", { value: a.id, selected: a.id === DB.activeId ? "selected" : null }, (a.meta && a.meta.name) || "(unnamed)"));
    }
    const del = $("#btnDelArmy"); if (del) del.disabled = DB.armies.length <= 1;
    const tr = $("#tabRoster"), ts = $("#tabScoring");
    if (tr) tr.classList.toggle("active", view === "roster");
    if (ts) ts.classList.toggle("active", view === "scoring");
    // turn box is roster-only
    const turnbox = $(".turnbox"); if (turnbox) turnbox.style.display = view === "scoring" ? "none" : "";
    const root = $("#roster");
    root.innerHTML = "";
    if (view === "scoring") { renderScoring(root); return; }
    if (!state.units.length) {
      root.append(el("div", { class: "empty" }, [
        el("p", { html: "No army loaded." }),
        el("p", { class: "muted", html: "Open the <b>☰ menu → Import list</b> and choose your Old World Builder <code>.owb.json</code> export." }),
      ]));
      return;
    }
    // army summary
    const total = state.units.length;
    const destroyed = state.units.filter(unitDead).length;
    const models = state.units.reduce((s, u) => s + (unitDead(u) ? 0 : modelsRemaining(u)), 0);
    const parts = [(total - destroyed) + "/" + total + " units", models + " models"];
    if (state.meta.points) parts.push(state.meta.points + " pts");
    root.append(el("div", { class: "summary muted small" }, parts.join("  ·  ")));

    // VP-relevant losses (what the foe scores from your army)
    const goneN = state.units.filter(unitGone).length;
    const fleeN = state.units.filter((u) => u.status === "fleeing" && !unitGone(u)).length;
    const qN = state.units.filter((u) => !unitGone(u) && u.status !== "fleeing" && unitQuarter(u)).length;
    const loss = [];
    if (goneN) loss.push(goneN + " destroyed/fled");
    if (fleeN) loss.push(fleeN + " fleeing");
    if (qN) loss.push(qN + " quartered");
    if (state.units.some((u) => hasCmd(u, /general/i) && (unitGone(u) || u.status === "fleeing"))) loss.push("General down");
    if (state.units.some((u) => hasCmd(u, /battle standard bearer/i) && (unitGone(u) || u.status === "fleeing"))) loss.push("BSB down");
    if (loss.length) root.append(el("div", { class: "summary loss small" }, "⚠ Foe scores: " + loss.join("  ·  ")));

    const cats = ["Characters", "Core", "Special", "Rare", "Allies"];
    const order = {}; cats.forEach((c, i) => (order[c] = i));
    const sorted = [...state.units].sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9));
    let lastCat = null;
    for (const u of sorted) {
      if (u.category !== lastCat) { root.append(el("h2", { class: "cat" }, u.category)); lastCat = u.category; }
      root.append(unitCard(u));
    }
  }

  // ---- scoring -------------------------------------------------------------
  // Tournament scoring scales. w/d/l = tournament points for win/draw/loss.
  // manual = you type the battle points your event awards; none = VP only.
  const SCORE_SCALES = [
    { id: "vpdiff20", name: "VP difference → 20 pts (Warfare 2026)", table: true, tpUnit: "TP" },
    { id: "wdl3", name: "Win / Draw / Loss — 3 / 1 / 0", w: 3, d: 1, l: 0 },
    { id: "wdl2", name: "Win / Draw / Loss — 2 / 1 / 0", w: 2, d: 1, l: 0 },
    { id: "wdl10", name: "Win / Draw / Loss — 10 / 5 / 0", w: 10, d: 5, l: 0 },
    { id: "margin", name: "Battle points (enter each game manually)", manual: true },
    { id: "vponly", name: "Victory Points only (no tournament points)", none: true },
  ];
  function scoreScale(sc) { return SCORE_SCALES.find((s) => s.id === (sc && sc.scale)) || SCORE_SCALES[0]; }

  // --- Objectives & baggage: a running VP tally per side (adds to game VP) ---
  // side is "me" | "them". Just the points you've claimed from objectives,
  // baggage trains, etc. — no turn/hold bookkeeping.
  // Secondary objectives: "once" ones are a per-side tick; "perturn" ones are
  // tapped each turn they're held and accrue their VP per tap (a count per side).
  function secVP(g, side) {
    const done = g.secDone || {};
    let t = 0;
    for (const s of (g.secondaries || [])) {
      const st = done[s.id]; if (!st) continue;
      const v = num(s.vp) || 0;
      if (s.mode === "perturn") t += (num(st[side]) || 0) * v;
      else if (st[side]) t += v;
    }
    return t;
  }
  // Objective VP for a side = repeatable objective taps + checked secondaries.
  function objVP(g, side) { return (num(side === "me" ? g.objMine : g.objThem) || 0) + secVP(g, side); }
  // Effective VP = victory points you enter (casualties) + objective/baggage VP.
  function effMy(g) { return (num(g.myVP) || 0) + objVP(g, "me"); }
  function effOpp(g) { return (num(g.oppVP) || 0) + objVP(g, "them"); }
  function gameHasScore(g) { return num(g.myVP) !== "" || num(g.oppVP) !== "" || objVP(g, "me") > 0 || objVP(g, "them") > 0; }

  // Warfare 2026: tournament points from the VP difference (winner–loser),
  // using effective VP so captured objectives count. 0–150 = 10–10 (draw),
  // then +1/–1 per 150 VP up to 20–0 at 1501+.
  function vpDiffTP(g) {
    if (!gameHasScore(g)) return null;
    const diff = effMy(g) - effOpp(g), ad = Math.abs(diff);
    if (ad <= 150) return 10; // draw band, both score 10
    const winTP = Math.min(20, 10 + Math.ceil((ad - 150) / 150));
    return diff > 0 ? winTP : 20 - winTP;
  }
  function gameResult(g, scale) {
    if (g.resultOverride) return g.resultOverride; // "W" | "D" | "L"
    if (!gameHasScore(g)) return "";
    const a = effMy(g), b = effOpp(g);
    if (scale && scale.table) { const d = a - b; return Math.abs(d) <= 150 ? "D" : d > 0 ? "W" : "L"; }
    return a > b ? "W" : a < b ? "L" : "D";
  }
  function gameTP(g, scale) {
    if (scale.none) return null;
    if (scale.table) { const t = vpDiffTP(g); return t == null ? 0 : t; }
    if (scale.manual) return num(g.tp) === "" ? 0 : num(g.tp);
    const r = gameResult(g, scale);
    return r === "W" ? scale.w : r === "D" ? scale.d : r === "L" ? scale.l : 0;
  }
  // Secondary points fold into the total only for simple point scales (not the
  // VP-difference table, where the table already captures the whole result).
  function gameSec(g) { return num(g.secpts) === "" ? 0 : num(g.secpts); }
  function gameTotal(g, scale) { const base = gameTP(g, scale); if (base == null) return null; return base + (scale.table ? 0 : gameSec(g)); }
  function newGame(sc) { return { id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), round: String((sc.games.length || 0) + 1), opponent: "", oppFaction: "", scenario: "", myVP: "", oppVP: "", resultOverride: "", secondary: "", secpts: "", tp: "", notes: "", objMine: "", objThem: "", objOn: false, objVal: "100", gameTurn: 1, secondaries: [], secDone: {}, addsMine: [], addsThem: [] }; }

  // Setup dialog shown when adding (or editing) a game — pick the mission's VP
  // values and whether baggage trains are in use, then lock them in.
  // Armies an opponent might field in Warhammer: The Old World.
  const OPPONENT_ARMIES = [
    "Warriors of Chaos",
    "Beastmen Brayherds",
    "Daemons of Chaos",
    "Chaos Dwarfs",
    "Orc & Goblin Tribes",
    "Skaven",
    "Tomb Kings of Khemri",
    "Vampire Counts",
    "The Empire",
    "Kingdom of Bretonnia",
    "Dwarfen Mountain Holds",
    "High Elf Realms",
    "Wood Elf Realms",
    "Dark Elves",
    "Lizardmen",
    "Ogre Kingdoms",
    "Renegade Crowns",
    "Other",
  ];

  // The six Matched Play Guide scenarios.
  const SCENARIO_PRESETS = [
    "Upon the Field of Glory",
    "King of the Hill",
    "Drawn Battlelines",
    "Close Quarters",
    "A Chance Encounter",
    "Encirclement",
  ];

  // Secondary objectives from the Matched Play Guide, with their VP values.
  // mode "perturn" = tapped each turn held (accrues); "once" = a single tick.
  const SECONDARY_PRESETS = [
    { name: "Strategic location", vp: 30, mode: "perturn" },
    { name: "King of the Hill", vp: 100, mode: "perturn" },
    { name: "Domination — quarter held", vp: 100, mode: "once" },
    { name: "Special feature (held at end)", vp: 200, mode: "once" },
    { name: "Baggage train — held at end", vp: 100, mode: "once" },
    { name: "Baggage train — destroyed enemy's", vp: 250, mode: "once" },
  ];

  function openGameSetup(sc, game) {
    const isNew = !game;
    const g = game || newGame(sc);
    const factionOpts = [""].concat(OPPONENT_ARMIES);
    if (g.oppFaction && factionOpts.indexOf(g.oppFaction) === -1) factionOpts.push(g.oppFaction); // keep any custom value
    const field = (label, node) => el("label", { class: "scorefield full" }, [el("span", { class: "muted small" }, label), node]);
    const roundIn = el("input", { class: "scoreinput", value: g.round || "" });
    const oppIn = el("input", { class: "scoreinput", placeholder: "Name", value: g.opponent || "" });
    const facSel = el("select", { class: "scoreinput" });
    for (const f of factionOpts) facSel.append(el("option", { value: f, selected: f === g.oppFaction ? "selected" : null }, f || "—"));
    // Scenario: dropdown of named missions + Custom… (free text).
    const isCustomScen = g.scenario && !SCENARIO_PRESETS.includes(g.scenario);
    const scenSel = el("select", { class: "scoreinput" });
    scenSel.append(el("option", { value: "" }, "—"));
    for (const s of SCENARIO_PRESETS) scenSel.append(el("option", { value: s, selected: s === g.scenario ? "selected" : null }, s));
    scenSel.append(el("option", { value: "__custom", selected: isCustomScen ? "selected" : null }, "Custom…"));
    const scenCustom = el("input", { class: "scoreinput", placeholder: "Mission name", value: isCustomScen ? g.scenario : "" });
    const scenCustomWrap = el("div", { class: "scencustom" }, [scenCustom]);
    const syncScen = () => { scenCustomWrap.style.display = scenSel.value === "__custom" ? "" : "none"; };
    scenSel.addEventListener("change", syncScen); syncScen();
    const objIn = el("input", { class: "scoreinput", type: "number", inputmode: "numeric", placeholder: "0", value: g.objVal == null ? "100" : g.objVal });
    // "Does this game have a simple claimable objective?" — reveals its points.
    const objChk = el("input", { type: "checkbox", checked: g.objOn ? "checked" : null });
    const objValWrap = field("Objective VP (each claim)", objIn);
    const syncObj = () => { objValWrap.style.display = objChk.checked ? "" : "none"; };
    objChk.addEventListener("change", syncObj); syncObj();

    const body = el("div", { class: "setupform" }, [
      el("div", { class: "setuprow2" }, [field("Round", roundIn), field("Their army", facSel)]),
      field("Opponent", oppIn),
      field("Scenario / mission", el("div", {}, [scenSel, scenCustomWrap])),
      el("div", { class: "setupsep" }, "Victory Points this game"),
      el("label", { class: "bagchk full" }, [objChk, el("span", {}, "This game has a claimable objective")]),
      objValWrap,
      el("p", { class: "muted small" }, "Add secondary objectives (each with its own VP) on the game screen once you start — use them for objectives worth different amounts."),
    ]);
    const start = el("button", { class: "primary", onclick: () => {
      g.round = roundIn.value.trim() || g.round;
      g.opponent = oppIn.value.trim();
      g.oppFaction = facSel.value;
      g.scenario = scenSel.value === "__custom" ? scenCustom.value.trim() : scenSel.value;
      g.objOn = objChk.checked;
      g.objVal = objIn.value === "" ? "0" : objIn.value;
      if (isNew) sc.games.push(g);
      save(); closeModal(); render();
    } }, isNew ? "Start game ▶" : "Save");
    openModal(isNew ? "New game" : "Edit game setup", body, [el("button", { class: "ghost", onclick: closeModal }, "Cancel"), start]);
  }

  // VP line items for the tally helper (Warfare 2026 triggers). Fixed-value
  // ones prefill their points; %-of-points ones you enter (need the unit's pts).
  const VP_TALLY_PRESETS = [
    { label: "Unit/character destroyed (full pts)", pts: "" },
    { label: "Fleeing at game end (½ pts)", pts: "" },
    { label: "Reduced to ≤25% (½ pts)", pts: "" },
    { label: "General slain", pts: 100 },
    { label: "BSB slain / fled", pts: 50 },
    { label: "Standard captured", pts: 50 },
  ];
  // Guided VP builder: rows of {label, pts} that sum into the My/Their VP field.
  function vpTallyModal(g, which, onDone) {
    const key = which === "mine" ? "tallyMine" : "tallyOpp";
    const rows = (g[key] && g[key].length) ? clone(g[key]) : [{ label: "", pts: "" }];
    const listWrap = el("div", { class: "tallylist" });
    const totalEl = el("b", {}, "0");
    function recalc() { let t = 0; for (const r of rows) t += num(r.pts) === "" ? 0 : num(r.pts); totalEl.textContent = String(t); return t; }
    function draw() {
      listWrap.innerHTML = "";
      rows.forEach((r, i) => {
        listWrap.append(el("div", { class: "tallyrow" }, [
          el("input", { class: "scoreinput grow", placeholder: "What you scored", value: r.label, onchange: (e) => { r.label = e.target.value; } }),
          el("input", { class: "scoreinput tiny", type: "number", inputmode: "numeric", placeholder: "0", value: r.pts, onchange: (e) => { r.pts = e.target.value; recalc(); } }),
          el("button", { class: "icon", title: "Remove", onclick: () => { rows.splice(i, 1); if (!rows.length) rows.push({ label: "", pts: "" }); draw(); recalc(); } }, "✕"),
        ]));
      });
      recalc();
    }
    draw();
    const presetRow = el("div", { class: "tallypresets" });
    for (const p of VP_TALLY_PRESETS) presetRow.append(el("button", { class: "chip", onclick: () => { rows.push({ label: p.label, pts: p.pts === "" ? "" : String(p.pts) }); draw(); recalc(); } }, "＋ " + p.label));
    const body = el("div", {}, [
      el("p", { class: "muted small" }, "Add each thing you scored VP for and its points — the total fills in the VP box."),
      presetRow,
      listWrap,
      el("button", { class: "chip", onclick: () => { rows.push({ label: "", pts: "" }); draw(); } }, "＋ Blank row"),
      el("div", { class: "tallytotal" }, [el("span", { class: "muted small" }, "Total VP"), totalEl]),
    ]);
    const foot = [
      el("button", { class: "ghost", onclick: closeModal }, "Cancel"),
      el("button", { class: "primary", onclick: () => { const t = recalc(); g[key] = rows.filter((r) => r.label || r.pts !== ""); g[which === "mine" ? "myVP" : "oppVP"] = String(t); save(); closeModal(); if (onDone) onDone(); } }, "Apply total"),
    ];
    openModal((which === "mine" ? "Your" : "Their") + " Victory Points — Round " + (g.round || "?"), body, foot);
  }

  // Copy a plain-text results summary (for reporting to a tournament organiser).
  function copyResults(sc, scale) {
    const lines = [];
    lines.push((state.meta.name || "Army") + (sc.event ? " — " + sc.event : ""));
    let W = 0, Dr = 0, L = 0, bp = 0, vpF = 0, vpA = 0;
    for (const g of sc.games) { const r = gameResult(g, scale); if (r === "W") W++; else if (r === "D") Dr++; else if (r === "L") L++; const t = gameTotal(g, scale); if (t != null) bp += t; vpF += effMy(g); vpA += effOpp(g); }
    lines.push("Record " + W + "-" + Dr + "-" + L + (scale.none ? "" : " · " + bp + (scale.table ? " TP" : " battle pts")) + " · VP " + (vpF - vpA >= 0 ? "+" : "") + (vpF - vpA));
    sc.games.forEach((g, i) => {
      const r = gameResult(g, scale), rl = r === "W" ? "WIN" : r === "D" ? "DRAW" : r === "L" ? "LOSS" : "—";
      const t = gameTotal(g, scale);
      lines.push("R" + (g.round || i + 1) + " vs " + (g.opponent || "?") + (g.oppFaction ? " (" + g.oppFaction + ")" : "") + ": " + rl + " " + effMy(g) + "-" + effOpp(g) + (t != null ? " [" + t + "]" : ""));
    });
    const text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => flash("Results copied"), () => flash("Copy failed"));
    else { try { const ta = el("textarea", {}, text); document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); flash("Results copied"); } catch (e) { flash("Copy not supported"); } }
  }

  function renderScoring(root) {
    const sc = state.scoring || (state.scoring = newScoring());
    const scale = scoreScale(sc);
    const wrap = el("div", { class: "scoring" });

    // --- event + scale row ---
    const eventInput = el("input", { class: "scoreinput grow", placeholder: "Event / campaign name (optional)", value: sc.event || "", onchange: (e) => { sc.event = e.target.value; save(); } });
    const scaleSel = el("select", { class: "scoreinput", onchange: (e) => { sc.scale = e.target.value; save(); render(); } });
    for (const s of SCORE_SCALES) scaleSel.append(el("option", { value: s.id, selected: s.id === scale.id ? "selected" : null }, s.name));
    wrap.append(el("div", { class: "scorehead" }, [
      el("label", { class: "scorefield grow" }, [el("span", { class: "muted small" }, "🏆 Event"), eventInput]),
      el("label", { class: "scorefield" }, [el("span", { class: "muted small" }, "Scoring"), scaleSel]),
    ]));

    // --- summary strip ---
    let W = 0, Dr = 0, L = 0, vpF = 0, vpA = 0, bp = 0;
    for (const g of sc.games) {
      const r = gameResult(g, scale);
      if (r === "W") W++; else if (r === "D") Dr++; else if (r === "L") L++;
      if (num(g.myVP) !== "") vpF += num(g.myVP);
      if (num(g.oppVP) !== "") vpA += num(g.oppVP);
      const tp = gameTotal(g, scale);
      if (tp != null) bp += tp;
    }
    const paint = num(sc.bonuses.painting) === "" ? 0 : num(sc.bonuses.painting);
    const sports = num(sc.bonuses.sports) === "" ? 0 : num(sc.bonuses.sports);
    const grand = bp + paint + sports;
    const tiles = [
      ["Games", sc.games.length],
      ["Record", W + "–" + Dr + "–" + L, "W–D–L"],
      ["VP for", vpF],
      ["VP against", vpA],
      ["VP diff", (vpF - vpA > 0 ? "+" : "") + (vpF - vpA)],
    ];
    if (!scale.none) tiles.push([scale.table ? "Tournament pts" : "Battle pts", bp]);
    const strip = el("div", { class: "scoresum" });
    for (const [lab, val, sub] of tiles) strip.append(el("div", { class: "scoretile" }, [el("b", {}, String(val)), el("span", { class: "muted small" }, sub || lab)]));
    wrap.append(strip);
    if (sc.games.length) wrap.append(el("div", { class: "scoreactions" }, [
      el("button", { class: "ghost small", onclick: () => copyResults(sc, scale) }, "⧉ Copy results"),
    ]));

    // --- games ---
    if (!sc.games.length) {
      wrap.append(el("div", { class: "empty" }, [
        el("p", { html: "No games recorded yet." }),
        el("p", { class: "muted small", html: "Add a game after each round to build up your tournament record." }),
      ]));
    }
    const factionOpts = [""].concat(Object.keys(window.FACTIONS || {}).map((k) => window.FACTIONS[k].factionName)).concat(["Other"]);
    for (const g of sc.games) wrap.append(gameCard(g, sc, scale, factionOpts));

    wrap.append(el("button", { class: "primary addgame", onclick: () => openGameSetup(sc, null) }, "＋ Add game"));

    // --- overall bonuses (many events add painting / sportsmanship) ---
    if (!scale.none) {
      const paintIn = el("input", { class: "scoreinput", type: "number", inputmode: "numeric", placeholder: "0", value: sc.bonuses.painting, onchange: (e) => { sc.bonuses.painting = e.target.value; save(); render(); } });
      const sportsIn = el("input", { class: "scoreinput", type: "number", inputmode: "numeric", placeholder: "0", value: sc.bonuses.sports, onchange: (e) => { sc.bonuses.sports = e.target.value; save(); render(); } });
      wrap.append(el("details", { class: "scorebonus" }, [
        el("summary", {}, "Overall bonuses & grand total"),
        el("div", { class: "bonusrow" }, [
          el("label", { class: "scorefield" }, [el("span", { class: "muted small" }, "Painting"), paintIn]),
          el("label", { class: "scorefield" }, [el("span", { class: "muted small" }, "Sportsmanship"), sportsIn]),
          el("div", { class: "grandtotal" }, [el("span", { class: "muted small" }, "Grand total"), el("b", {}, String(grand))]),
        ]),
      ]));
    }

    const noteHtml = scale.table
      ? "Warfare 2026: tournament points come from the VP difference (0–150 = 10–10 draw, up to 20–0 at 1501+). Tap the ⚖ beside a VP box to tally it — General slain +100, BSB +50/+100, standard +50, destroyed = full pts, fleeing / ≤25% = half."
      : "Tap the ⚖ beside a VP box to tally it up from what you scored.";
    wrap.append(el("p", { class: "muted small scorenote", html: noteHtml }));
    root.append(wrap);
  }

  function gameCard(g, sc, scale, factionOpts) {
    const r = gameResult(g, scale);
    const rLabel = r === "W" ? "WIN" : r === "D" ? "DRAW" : r === "L" ? "LOSS" : "—";
    const rClass = r === "W" ? "win" : r === "D" ? "draw" : r === "L" ? "loss" : "";
    const total = gameTotal(g, scale);
    const sec = gameSec(g);

    const fld = (label, node) => el("label", { class: "scorefield" }, [el("span", { class: "muted small" }, label), node]);
    const inp = (key, opts) => el("input", Object.assign({ class: "scoreinput", value: g[key] == null ? "" : g[key], onchange: (e) => { g[key] = e.target.value; save(); render(); } }, opts || {}));
    // A VP field with a "⚖ tally" helper button beside it.
    const vpField = (label, key, which) => el("label", { class: "scorefield" }, [
      el("span", { class: "muted small" }, label),
      el("div", { class: "vprow" }, [
        el("input", { class: "scoreinput", type: "number", inputmode: "numeric", placeholder: "0", value: g[key] == null ? "" : g[key], onchange: (e) => { g[key] = e.target.value; save(); render(); } }),
        el("button", { class: "vptally", title: "Tally VP", onclick: () => vpTallyModal(g, which, render) }, "⚖"),
      ]),
    ]);

    const resSel = el("select", { class: "scoreinput", onchange: (e) => { g.resultOverride = e.target.value; save(); render(); } });
    for (const [v, t] of [["", "Auto (by VP)"], ["W", "Win"], ["D", "Draw"], ["L", "Loss"]]) resSel.append(el("option", { value: v, selected: v === (g.resultOverride || "") ? "selected" : null }, t));

    const head = el("div", { class: "gamehead" }, [
      el("div", { class: "gameround" }, [el("span", { class: "muted small" }, "Round"), inp("round", { class: "scoreinput tiny" })]),
      el("div", { class: "gameopp" }, g.opponent ? g.opponent + (g.oppFaction ? " · " + g.oppFaction : "") : "New game"),
      el("span", { class: "resbadge " + rClass }, rLabel),
      total != null ? el("span", { class: "tpbadge", title: sec && !scale.table ? gameTP(g, scale) + " + " + sec + " secondary" : "" }, total + " " + (scale.tpUnit || "bp")) : null,
      el("button", { class: "icon del", title: "Delete game", onclick: () => { if (confirm("Delete this game?")) { sc.games = sc.games.filter((x) => x !== g); save(); render(); } } }, "✕"),
    ]);

    // Casualty VP + result + notes — tucked into a collapsed panel so the
    // in-game card stays lean (opponent/scenario/VP values live in ✎ setup).
    const grid = el("div", { class: "gamegrid" }, [
      vpField("Your casualty VP", "myVP", "mine"),
      vpField("Their casualty VP", "oppVP", "opp"),
      fld("Result", resSel),
      scale.manual ? fld("Battle pts", inp("tp", { type: "number", inputmode: "numeric", placeholder: "0" })) : null,
      (scale.none || scale.table) ? null : fld("Secondary pts", inp("secpts", { type: "number", inputmode: "numeric", placeholder: "0" })),
    ]);
    const notes = fld("Notes", inp("notes", { placeholder: "How it went…" }));
    notes.classList.add("full");
    grid.append(notes);
    const details = el("details", { class: "gamedetails" }, [el("summary", {}, "＋ Casualty VP, result & notes"), grid]);

    // Effective VP readout when objectives/baggage are contributing.
    const om = objVP(g, "me"), ot = objVP(g, "them");
    const effRow = (om || ot) ? el("div", { class: "effvp small" }, "VP incl. objectives — You " + effMy(g) + " · Them " + effOpp(g) + "  (" + (om ? "+" + om : "0") + " / " + (ot ? "+" + ot : "0") + " objectives)") : null;

    // In-game battle-turn stepper (self-contained in Scoring — no roster needed).
    const gt = g.gameTurn || 1;
    const turnRow = el("div", { class: "gameturn" }, [
      el("button", { class: "turnbtn", disabled: gt <= 1 ? "disabled" : null, title: "Previous turn", onclick: () => { g.gameTurn = Math.max(1, (g.gameTurn || 1) - 1); save(); render(); } }, "◀"),
      el("span", { class: "gameturnlabel" }, ["Battle turn ", el("b", {}, String(gt))]),
      el("button", { class: "turnbtn primary", title: "Next turn", onclick: () => { g.gameTurn = (g.gameTurn || 1) + 1; save(); render(); } }, "Next ▶"),
    ]);

    return el("div", { class: "gamecard " + rClass }, [head, turnRow, objectivePanel(g, sc), effRow, details]);
  }

  // Big-button objective/baggage scorer: tap ＋Objective / ＋Baggage under YOU or
  // THEM to add points; ↩ Undo takes the last one back. VP values are locked in
  // from the game setup (edit via the ✎ button). Folds into the game VP.
  function objectivePanel(g, sc) {
    if (g.objVal == null) g.objVal = "100";
    g.addsMine = g.addsMine || []; g.addsThem = g.addsThem || [];
    const objVal = num(g.objVal) || 0;

    const add = (side, n) => {
      if (!n) return;
      const totKey = side === "me" ? "objMine" : "objThem", stack = side === "me" ? g.addsMine : g.addsThem;
      g[totKey] = String(Math.max(0, (num(g[totKey]) || 0) + n));
      stack.push(n); save(); render();
    };
    const undo = (side) => {
      const totKey = side === "me" ? "objMine" : "objThem", stack = side === "me" ? g.addsMine : g.addsThem;
      if (!stack.length) return;
      g[totKey] = String(Math.max(0, (num(g[totKey]) || 0) - stack.pop()));
      save(); render();
    };
    const secondaries = g.secondaries || [];
    g.secDone = g.secDone || {};
    const col = (side, label, cls) => {
      const stack = side === "me" ? g.addsMine : g.addsThem;
      return el("div", { class: "bigcol " + cls }, [
        el("div", { class: "bigcolh" }, label),
        el("div", { class: "bigtotal" }, String(objVP(g, side))),
        el("button", { class: "bigbtn", onclick: () => add(side, objVal) }, ["＋ Objective", el("span", { class: "bigsub" }, "+" + objVal)]),
        el("button", { class: "bigbtn undo", disabled: stack.length ? null : "disabled", onclick: () => undo(side) }, "↩ Undo"),
      ]);
    };
    const showBig = !!g.objOn; // generic objective columns only when it's in play

    // Secondaries: "once" = a per-side tick; "perturn" = tap ＋ each turn held.
    // Added/removed right here on the game screen.
    const addSecondary = (name, vp, mode) => {
      g.secondaries = g.secondaries || [];
      g.secondaries.push({ id: "s" + Date.now().toString(36) + g.secondaries.length, name: name, vp: vp == null || vp === "" ? "0" : String(vp), mode: mode === "perturn" ? "perturn" : "once" });
      save(); render();
    };
    const secRows = [];
    if (secondaries.length) {
      secRows.push(el("div", { class: "secheadrow" }, [el("span", { class: "muted small" }, "YOU"), el("span", { class: "secheadname muted small" }, "Secondary"), el("span", { class: "muted small" }, "THEM"), el("span", {})]));
      for (const s of secondaries) {
        const per = s.mode === "perturn";
        const st = (g.secDone[s.id] = g.secDone[s.id] || (per ? { me: 0, them: 0 } : { me: false, them: false }));
        const control = (side) => {
          if (!per) return el("input", { type: "checkbox", class: "seccb", checked: st[side] ? "checked" : null, onchange: () => { st[side] = !st[side]; save(); render(); } });
          const n = num(st[side]) || 0;
          return el("div", { class: "secstep" }, [
            el("button", { class: "secminus", disabled: n ? null : "disabled", onclick: () => { st[side] = Math.max(0, (num(st[side]) || 0) - 1); save(); render(); } }, "−"),
            el("b", { class: "seccount" }, "×" + n),
            el("button", { class: "secplus", onclick: () => { st[side] = (num(st[side]) || 0) + 1; save(); render(); } }, "＋"),
          ]);
        };
        const vpEdit = el("div", { class: "secvpedit" }, [
          el("input", { class: "scoreinput tiny", type: "number", inputmode: "numeric", value: s.vp, onchange: (e) => { s.vp = e.target.value; save(); render(); } }),
          el("span", { class: "muted small" }, per ? "VP/turn" : "VP"),
        ]);
        secRows.push(el("div", { class: "secrow2" + (per ? " per" : "") }, [
          control("me"),
          el("div", { class: "secname" }, [el("b", {}, s.name), vpEdit]),
          control("them"),
          el("button", { class: "icon secdel", title: "Remove secondary", onclick: () => { g.secondaries = g.secondaries.filter((x) => x !== s); if (g.secDone) delete g.secDone[s.id]; save(); render(); } }, "✕"),
        ]));
      }
    }
    // Add-secondary dropdown (presets + custom).
    const addSel = el("select", { class: "scoreinput addsec", onchange: (e) => {
      const v = e.target.value; e.target.value = "";
      if (!v) return;
      if (v === "__custom") {
        const name = (prompt("Secondary name?") || "").trim(); if (!name) return;
        const vp = prompt("VP for “" + name + "”?", "100");
        const per = confirm("Scored EACH TURN it's held? (OK = per turn, Cancel = one-off)");
        addSecondary(name, vp == null ? "0" : vp, per ? "perturn" : "once");
      } else { const p = SECONDARY_PRESETS.find((x) => x.name === v); addSecondary(p ? p.name : v, p ? p.vp : "0", p ? p.mode : "once"); }
    } });
    addSel.append(el("option", { value: "" }, "＋ Add secondary…"));
    for (const p of SECONDARY_PRESETS) addSel.append(el("option", { value: p.name }, p.name + " (" + p.vp + " VP" + (p.mode === "perturn" ? "/turn" : "") + ")"));
    addSel.append(el("option", { value: "__custom" }, "Custom…"));
    secRows.push(addSel);
    const secSection = el("div", { class: "secchecks" }, secRows);

    // Locked-in setup summary, with an edit affordance.
    const bits = [];
    if (g.scenario) bits.push(g.scenario);
    if (showBig) bits.push("Objective " + objVal + " VP");
    if (secondaries.length) bits.push(secondaries.length + " secondary" + (secondaries.length > 1 ? "s" : ""));
    const setupLine = el("div", { class: "objsetupline" }, [
      el("span", { class: "muted small" }, bits.join("  ·  ")),
      el("button", { class: "chip", onclick: () => openGameSetup(sc, g) }, "✎ Edit"),
    ]);

    // Collapsible: many missions have no objectives, so keep it out of the way
    // and only open it automatically once objectives/secondaries are in play.
    const om = objVP(g, "me"), ot = objVP(g, "them");
    const active = showBig || secondaries.length > 0 || om > 0 || ot > 0;
    const det = el("details", { class: "objpanel" });
    if (active) det.setAttribute("open", "");
    det.append(
      el("summary", { class: "objpanelhead" }, [
        el("span", {}, "🎯 Objectives & secondaries"),
        (om || ot) ? el("span", { class: "objsummtot" }, "You " + om + " · Them " + ot) : el("span", { class: "muted small objsummtot" }, "tap to add"),
      ]),
      setupLine,
      showBig ? el("div", { class: "bigcols" }, [col("me", "YOU", "you"), col("them", "THEM", "them")]) : null,
      secSection
    );
    return det;
  }

  function statCell(label, val, base, lowerBetter) {
    const changed = val !== "" && base !== "" && val != null && base != null && num(val) !== num(base);
    let dir = "", arrow = "";
    if (changed) {
      const better = lowerBetter ? num(val) < num(base) : num(val) > num(base);
      dir = better ? " up" : " down";
      arrow = better ? "▲" : "▼";
    }
    return el("div", { class: "stat" + (changed ? " changed" + dir : "") }, [
      el("div", { class: "stat-l" }, label),
      el("div", { class: "stat-v" }, [
        String(val === "" || val == null ? "–" : val),
        changed ? el("span", { class: "arr" }, arrow) : null,
        changed ? el("span", { class: "stat-b" }, "was " + (base === "" ? "–" : base)) : null,
      ]),
    ]);
  }

  function fmtMount(v) {
    if (v == null || v === "") return "–";
    const s = String(v);
    return /^\+/.test(s) ? "(" + s + ")" : s;
  }

  function unitCard(u) {
    const { eff, base, rules } = effective(u);
    const def = P.matchUnit(u.name, D);
    const isSingle = u.isChar || u.models <= 1;
    const wmax = num(base.W) || 1;
    const wrem = Math.max(0, wmax - (u.woundsLost || 0));
    const remModels = modelsRemaining(u);
    const multiWound = wmax > 1;
    const status = u.status || null;
    const casualtyDead = remModels <= 0 || (isSingle && wrem <= 0);
    const gone = casualtyDead || status === "dead" || status === "fled";
    const fleeing = status === "fleeing";
    const quarter = unitQuarter(u);
    const half = !isSingle && remModels > 0 && remModels <= Math.floor(u.models / 2);
    const card = el("div", { class: "card mark-" + (u.mark || "none") + (gone ? " dead" : "") + (fleeing ? " fleeing" : "") + (u.collapsed ? " collapsed" : "") });

    // header
    const caret = el("button", { class: "caret", "aria-label": u.collapsed ? "Expand" : "Collapse", onclick: () => { u.collapsed = !u.collapsed; save(); render(); } }, u.collapsed ? "▸" : "▾");
    const title = el("input", { class: "u-name", value: u.name, placeholder: "Unit name", onchange: (e) => { u.name = e.target.value; save(); } });
    let markSel = null;
    if (D.hasMarks && D.MARKS && Object.keys(D.MARKS).length) {
      markSel = el("select", { class: "mark", onchange: (e) => { u.mark = e.target.value || null; save(); render(); } });
      markSel.append(el("option", { value: "" }, "No mark"));
      for (const k in D.MARKS) markSel.append(el("option", { value: k, selected: u.mark === k ? "selected" : null }, D.MARKS[k].name));
    }
    const delBtn = el("button", { class: "icon danger", title: "Remove unit", onclick: () => { if (confirm("Remove " + (u.name || "unit") + "?")) { state.units = state.units.filter((x) => x !== u); save(); render(); } } }, "✕");
    card.append(el("div", { class: "u-head" }, [caret, title, markSel, delBtn]));

    // status badges
    const badges = [];
    if (gone) badges.push(el("span", { class: "badge b-dead" }, status === "fled" ? "Fled off" : "Destroyed"));
    else if (fleeing) badges.push(el("span", { class: "badge b-flee" }, "⚑ Fleeing"));
    else if (quarter) badges.push(el("span", { class: "badge b-quarter" }, "¼ strength · ½ VP"));
    else if (half) badges.push(el("span", { class: "badge b-half" }, "½ strength"));
    if (badges.length) card.append(el("div", { class: "badges" }, badges));

    // stat line (always shown); rolled random values (e.g. Spawn M/A) display in place
    const statsRow = el("div", { class: "stats" });
    for (const k of D.STATS) {
      if (isRandom(base[k]) && u.rolled && u.rolled[k] != null) statsRow.append(statCell(k, u.rolled[k], base[k]));
      else statsRow.append(statCell(k, eff[k], base[k]));
    }
    statsRow.append(statCell("Sv", eff.Sv ? eff.Sv + "+" : "–", base.Sv ? base.Sv + "+" : "", true));
    statsRow.append(statCell("Wd", eff.Ward ? eff.Ward + "+" : "–", base.Ward ? base.Ward + "+" : "", true));
    card.append(statsRow);

    const optStr = (u.options || []).join(" ");
    const hasChampion = /champion|headman|headtaker|first sword|jarl|horsemaster/i.test(optStr);

    if (!u.collapsed) {
      // mount line — the mount's own printed profile; "(+N)" entries are folded
      // into the rider's line above (its actual T/W/M).
      if (u.mountProfile) {
        const mp = u.mountProfile;
        const mRow = el("div", { class: "stats mount" });
        for (const k of D.STATS) {
          const add = typeof mp[k] === "string" && /^\+/.test(mp[k]);
          mRow.append(el("div", { class: "stat" + (add ? " mountadd" : "") }, [el("div", { class: "stat-l" }, k), el("div", { class: "stat-v mlbl" }, fmtMount(mp[k]))]));
        }
        mRow.append(el("div", { class: "stat ghostcell" }));
        mRow.append(el("div", { class: "stat mlabel" }, [el("div", { class: "stat-l" }, "Mt"), el("div", { class: "stat-v mlbl" }, "🐎")]));
        card.append(mRow);
        if (u.mountNote) card.append(el("div", { class: "mountnote muted small" }, u.mountNote));
      }

      // champion line — only the characteristics that differ from the unit
      if (def && def.champ && (hasChampion || !(u.options || []).length)) {
        const champ = effective(u, def.champ).eff;
        const cRow = el("div", { class: "stats champ" });
        for (const k of D.STATS) {
          if (num(champ[k]) !== num(eff[k])) cRow.append(statCell(k, champ[k], eff[k]));
          else cRow.append(el("div", { class: "stat ghostcell" }));
        }
        cRow.append(el("div", { class: "stat ghostcell" }));
        cRow.append(el("div", { class: "stat mlabel" }, [el("div", { class: "stat-l" }, "Ch"), el("div", { class: "stat-v mlbl", title: def.champName || "Champion" }, "★")]));
        card.append(cRow);
      }

      // command models present
      const cmd = [];
      if (/general/i.test(optStr)) cmd.push("👑 General");
      if (/battle standard bearer/i.test(optStr)) cmd.push("⚑ Battle Standard");
      if (hasChampion) cmd.push("★ Champion");
      if (!/battle standard bearer/i.test(optStr) && /standard bearer/i.test(optStr)) cmd.push("⚑ Standard");
      if (/musician/i.test(optStr)) cmd.push("♪ Musician");
      if (cmd.length) card.append(el("div", { class: "cmdline" }, cmd.map((c) => el("span", { class: "cmdchip" }, c))));
    }

    // casualties / wounds tracker (always shown — the core live control)
    const track = el("div", { class: "track" });
    if (!isSingle) {
      track.append(stepper("Models", remModels, u.models, null, null,
        (n) => { u.modelsLost = Math.max(0, Math.min(u.models, u.models - n)); save(); render(); }, true));
    }
    if (isSingle || multiWound) {
      track.append(stepper(u.mountProfile ? "Wounds*" : "Wounds", wrem, wmax, null, null,
        (n) => { u.woundsLost = Math.max(0, Math.min(wmax, wmax - n)); save(); render(); }, true));
    }
    const randomStats = D.STATS.filter((k) => isRandom(base[k]));
    if (randomStats.length) {
      track.append(el("button", { class: "rollrand", title: "Roll this unit's random values for the turn", onclick: () => {
        u.rolled = u.rolled || {};
        for (const k of randomStats) u.rolled[k] = rollExpr(base[k]);
        save(); render();
      } }, "🎲 Roll " + randomStats.join("/")));
    }
    card.append(track);

    // VP status — Fleeing / Fled off / Dead (mutually exclusive)
    const setStatus = (s) => { u.status = (u.status === s) ? null : s; save(); render(); };
    card.append(el("div", { class: "statusrow" }, [
      el("button", { class: "stbtn flee" + (status === "fleeing" ? " on" : ""), onclick: () => setStatus("fleeing") }, "⚑ Fleeing"),
      el("button", { class: "stbtn fled" + (status === "fled" ? " on" : ""), onclick: () => setStatus("fled") }, "↩ Fled off"),
      el("button", { class: "stbtn dead" + (status === "dead" ? " on" : ""), onclick: () => setStatus("dead") }, "☠ Dead"),
    ]));

    if (u.collapsed) return card; // compact view stops here

    // rules / tags — merge the unit's canonical special rules (correct per-unit
    // values, e.g. Chaos Armour (6+)) with any rules from the import, deduped by
    // rule name so the canonical value wins.
    const ruleTags = [];
    const seenRule = new Set();
    const ruleKey = (r) => String(r).toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    const addRule = (r) => { const k = ruleKey(r); if (!k || seenRule.has(k)) return; seenRule.add(k); ruleTags.push(r); };
    for (const r of (def && def.rules) || []) addRule(r);
    for (const r of (u.baseRules || [])) addRule(r);
    const hasTags = ruleTags.length || rules.length || u.mount;
    if (hasTags) {
      const tags = el("div", { class: "tags" });
      if (u.mount) tags.append(el("span", { class: "tag t-mount" }, "🐎 " + u.mount));
      for (const r of ruleTags) tags.append(el("a", { class: "tag t-rule link", href: ruleLookupUrl(r), target: "_blank", rel: "noopener noreferrer", title: "Look up “" + r + "” on tow.whfb.app" }, r));
      for (const r of rules) tags.append(el("span", { class: "tag t-" + r.src }, r.text));
      card.append(tags);
    }
    if (u.notes) card.append(el("div", { class: "unitnote muted small" }, u.notes));

    // active rewards, items & effects (with remove)
    const chips = el("div", { class: "active" });
    for (const iid of u.items || []) {
      const it = findItem(iid);
      if (!it) continue;
      chips.append(el("span", { class: "achip item", title: (it.rules || []).join("; ") }, [
        "⚜ " + it.name,
        el("button", { class: "x", onclick: () => { u.items = u.items.filter((x) => x !== iid); save(); render(); } }, "×"),
      ]));
    }
    for (const rid of u.rewards || []) {
      const r = findReward(rid);
      if (!r) continue;
      chips.append(el("span", { class: "achip gaze" + (r.bad ? " bad" : "") }, [
        "👁 " + r.name,
        el("button", { class: "x", onclick: () => { u.rewards = u.rewards.filter((x) => x !== rid); save(); render(); } }, "×"),
      ]));
    }
    for (const ef of u.effects || []) {
      const cls = ef.kind === "hex" ? "hex" : ef.kind === "augment" ? "aug" : "info";
      const sym = ef.kind === "hex" ? "▼ " : ef.kind === "augment" ? "▲ " : "✦ ";
      chips.append(el("span", { class: "achip " + cls }, [
        sym + ef.name + (ef.duration ? " · " + shortDur(ef.duration) : ""),
        el("button", { class: "x", onclick: () => { u.effects = u.effects.filter((x) => x !== ef); save(); render(); } }, "×"),
      ]));
    }
    if (chips.children.length) card.append(chips);
    if ((u.effects || []).length > 1) {
      card.append(el("button", { class: "dispel", onclick: () => { u.effects = []; save(); render(); } }, "✦ Clear all spells"));
    }

    // action buttons
    const canGaze = !!(def && def.gaze) || /gaze of the gods/i.test((u.baseRules || []).join(" ") + " " + (u.notes || ""));
    card.append(el("div", { class: "u-actions" }, [
      canGaze ? el("button", { class: "act gaze", onclick: () => gazeModal(u) }, "👁 Gaze") : null,
      canGaze ? el("button", { class: "act daddy", title: "Summon the Dark Gods' favour", onclick: () => {
        const roll = 1 + Math.floor(Math.random() * 6);
        const r = DB.gaze.find((x) => rollMatches(x.roll, roll)) || DB.gaze[Math.min(DB.gaze.length - 1, roll - 1)];
        if (r) { flash("📞 Daddy answers — D6 " + roll + " → " + r.name); applyReward(u, r); }
      } }, "📞 Call Daddy") : null,
      el("button", { class: "act spell", onclick: () => effectModal(u) }, "✦ Spell"),
      el("button", { class: "act", onclick: () => editModal(u) }, "✎ Edit"),
    ]));
    if (u.options && u.options.length) {
      card.append(el("details", { class: "opts" }, [
        el("summary", {}, "Equipment & options"),
        el("div", { class: "muted small" }, u.options.join(" · ")),
      ]));
    }
    return card;
  }

  function shortDur(d) {
    if (/next turn/i.test(d)) return "your turn";
    if (/end of turn/i.test(d)) return "turn";
    if (/remains/i.test(d)) return "RIP";
    if (/permanent/i.test(d)) return "battle";
    return d;
  }

  function stepper(label, val, max, inc, dec, setTo, compact) {
    const valEl = el("div", { class: "step-v" + (setTo ? " tappable" : ""), title: setTo ? "Tap to set" : null,
      onclick: setTo ? () => { const n = prompt("Set " + label.replace("*", "") + " (0–" + max + "):", String(val)); if (n == null) return; const v = parseInt(n, 10); if (!isNaN(v)) setTo(Math.max(0, Math.min(max, v))); } : null,
    }, [el("b", {}, String(val)), el("span", { class: "muted" }, "/" + max)]);
    if (compact) {
      return el("div", { class: "stepper compact" + (val <= 0 ? " empty" : "") }, [el("div", { class: "step-l" }, label), valEl]);
    }
    return el("div", { class: "stepper" + (val <= 0 ? " empty" : "") }, [
      el("div", { class: "step-l" }, label),
      el("div", { class: "step-c" }, [
        el("button", { class: "round minus", onclick: dec, "aria-label": "decrease " + label }, "−"),
        valEl,
        el("button", { class: "round plus", onclick: inc, "aria-label": "increase " + label }, "+"),
      ]),
    ]);
  }

  // ---- modals --------------------------------------------------------------
  function openModal(titleText, bodyNode, footNode) {
    closeModal();
    const back = el("div", { class: "modal-back", onclick: (e) => { if (e.target === back) closeModal(); } }, [
      el("div", { class: "modal" }, [
        el("div", { class: "modal-h" }, [el("h3", {}, titleText), el("button", { class: "icon", onclick: closeModal }, "✕")]),
        el("div", { class: "modal-b" }, bodyNode),
        footNode ? el("div", { class: "modal-f" }, footNode) : null,
      ]),
    ]);
    document.body.append(back);
    return back;
  }
  function closeModal() { const m = $(".modal-back"); if (m) m.remove(); }

  // Match a rolled dice number against a result's "roll" spec: "5", "3-4", "6+", "2".
  function rollMatches(spec, roll) {
    const s = String(spec || "").trim().replace(/[–—]/g, "-");
    let m;
    if ((m = s.match(/^(\d+)\s*\+$/))) return roll >= +m[1];
    if ((m = s.match(/^(\d+)\s*-\s*(\d+)$/))) return roll >= +m[1] && roll <= +m[2];
    if ((m = s.match(/^(\d+)$/))) return roll === +m[1];
    return false;
  }

  // Apply a Gaze result. Temporary results go to the effects list so "End of turn"
  // clears them; lasting results are stored as battle-long rewards.
  function applyReward(u, r) {
    if (r.temp) {
      u.effects = u.effects || [];
      u.effects.push({ id: "gaze-" + r.id, kind: "augment", name: r.name, mods: Object.assign({}, r.mods || {}), rules: (r.rules || []).slice(), duration: "Until start of your next turn" });
    } else {
      u.rewards = u.rewards || [];
      u.rewards.push(r.id);
    }
    save(); render();
  }

  function gazeModal(u) {
    const body = el("div", {});
    const last = el("div", { class: "rollout" });
    body.append(el("p", { class: "muted small", html: "Roll a <b>D6</b> in your <b>Command sub-phase</b> — the result affects the character, not their mount. Results 2 &amp; 3 last until your next turn (cleared by <b>Next ▶</b>); the rest last the battle. Values are <b>editable</b> via <b>Edit table</b>." }));
    body.append(el("div", { class: "rollrow" }, [
      el("button", { class: "big roll", onclick: () => {
        const roll = 1 + Math.floor(Math.random() * 6);
        const r = DB.gaze.find((x) => rollMatches(x.roll, roll)) || DB.gaze[Math.min(DB.gaze.length - 1, roll - 1)];
        last.innerHTML = "";
        last.append(el("div", { class: "rolled" }, [el("b", {}, "D6 = " + roll + " → "), r ? r.name : "—"]));
        if (r) applyReward(u, r);
      } }, "🎲 Roll D6"),
      last,
    ]));
    const list = el("div", { class: "picklist" });
    for (const r of DB.gaze) {
      list.append(el("button", { class: "pick" + (r.bad ? " bad" : ""), onclick: () => { applyReward(u, r); closeModal(); } }, [
        el("b", {}, r.roll + "  " + r.name + (r.temp ? " ⏳" : "")),
        el("span", { class: "muted small" }, describeMods(r) + (r.temp ? " · this turn" : "")),
      ]));
    }
    body.append(list);
    const foot = [
      el("button", { class: "ghost", onclick: () => editGazeTable() }, "Edit table"),
      el("button", { onclick: closeModal }, "Done"),
    ];
    openModal("Gaze of the Gods — " + (u.name || "unit"), body, foot);
  }


  function describeMods(r) {
    const parts = [];
    for (const k in (r.mods || {})) {
      if (k === "Ward") parts.push(r.mods[k] + "+ ward");
      else if (k === "Sv") parts.push(r.mods[k] + "+ save");
      else parts.push((r.mods[k] > 0 ? "+" : "") + r.mods[k] + " " + k);
    }
    for (const rl of (r.rules || [])) parts.push(rl);
    return parts.join(", ");
  }

  function effectModal(u) {
    const body = el("div", {});
    const durSel = el("select", { class: "dur" });
    for (const d of D.DURATIONS) durSel.append(el("option", { value: d }, d));
    body.append(el("div", { class: "durrow" }, [el("span", { class: "muted small" }, "Duration:"), durSel]));
    function addEffect(src) {
      const ef = clone(src);
      ef.duration = durSel.value;
      u.effects = u.effects || [];
      u.effects.push(ef);
      save(); render(); closeModal();
    }

    // --- Lore spells -------------------------------------------------------
    // Apply a known spell: instant damage spells just flash a reminder; spells
    // with an ongoing effect are added with their own duration.
    function castSpell(sp) {
      if (sp.instant) { flash(sp.name + " — " + describeMods(sp)); return; }
      u.effects = u.effects || [];
      u.effects.push({ id: sp.id, kind: sp.kind || "augment", name: sp.name, mods: clone(sp.mods || {}), rules: (sp.rules || []).slice(), duration: sp.duration || "Until end of turn" });
      save(); render(); closeModal();
    }
    const loreIds = Array.from(new Set([].concat(u.lores || [], Object.keys(D.LORES))));
    if (loreIds.length) {
      body.append(el("h4", {}, "✦ Lore spells"));
      const loreSel = el("select", {});
      for (const id of loreIds) loreSel.append(el("option", { value: id, selected: (u.activeLore === id || (!u.activeLore && id === loreIds[0])) ? "selected" : null }, D.LORE_NAMES[id] || id));
      body.append(el("div", { class: "durrow" }, [el("span", { class: "muted small" }, "Lore:"), loreSel]));
      const spellList = el("div", { class: "picklist" });
      function renderLore() {
        spellList.innerHTML = "";
        const spells = D.LORES[loreSel.value] || [];
        if (!spells.length) {
          spellList.append(el("div", { class: "muted small" }, "No spells stored for " + (D.LORE_NAMES[loreSel.value] || loreSel.value) + " yet — paste it to me and I'll add it, or use the building blocks below."));
          return;
        }
        for (const sp of spells) {
          const meta = [sp.type, "CV " + sp.cv, sp.range].filter(Boolean).join(" · ");
          spellList.append(el("button", { class: "pick spell " + (sp.kind === "hex" ? "hex" : sp.kind === "augment" ? "augment" : ""), onclick: () => castSpell(sp) }, [
            el("b", {}, sp.name + (sp.instant ? "" : "")),
            el("span", { class: "spellmeta" }, meta),
            el("span", { class: "muted small" }, describeMods(sp)),
          ]));
        }
      }
      loreSel.addEventListener("change", renderLore);
      renderLore();
      body.append(spellList);
      body.append(el("p", { class: "muted small", html: "Apply augments to the caster/target unit. Instant Magic Missile / Assailment spells just show a reminder." }));
    }

    body.append(el("h4", {}, "Building blocks"));
    for (const group of ["augment", "hex"]) {
      body.append(el("h4", { class: group === "augment" ? "augh" : "hexh" }, group === "augment" ? "▲ Augments (buffs)" : "▼ Hexes (debuffs)"));
      const list = el("div", { class: "picklist" });
      for (const s of D.SPELL_EFFECTS.filter((x) => x.kind === group)) {
        list.append(el("button", { class: "pick " + group, onclick: () => addEffect(s) }, [
          el("b", {}, s.name), el("span", { class: "muted small" }, describeMods(s)),
        ]));
      }
      body.append(list);
    }
    // custom
    body.append(el("h4", {}, "Custom effect"));
    const cname = el("input", { placeholder: "Name e.g. 'Pit of Shades'" });
    const cmods = el("input", { placeholder: "Mods e.g. S+1, T-1, A+2" });
    body.append(el("div", { class: "customrow" }, [cname, cmods,
      el("button", { onclick: () => {
        if (!cname.value.trim()) return;
        const mods = parseModString(cmods.value);
        addEffect({ id: "custom", kind: "augment", name: cname.value.trim(), mods });
      } }, "Add"),
    ]));
    openModal("Spells & effects — " + (u.name || "unit"), body, [el("button", { onclick: closeModal }, "Done")]);
  }

  // Parse "S+1, T-1, A+2, ward5" into a mods object.
  function parseModString(s) {
    const mods = {};
    for (const tok of String(s).split(/[,;]+/)) {
      const m = tok.trim().match(/^(M|WS|BS|S|T|W|I|A|Ld|Sv|Ward)\s*([+-]?\d+)$/i);
      if (m) {
        const key = m[1].length <= 2 ? m[1].toUpperCase() : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
        const norm = { M: "M", WS: "WS", BS: "BS", S: "S", T: "T", W: "W", I: "I", A: "A", LD: "Ld", SV: "Sv", WARD: "Ward" }[m[1].toUpperCase()];
        mods[norm] = parseInt(m[2], 10);
      }
    }
    return mods;
  }

  function editModal(u) {
    const body = el("div", {});
    body.append(el("p", { class: "muted small" }, "Base profile (the foundation everything else modifies). Verify against your book."));
    const grid = el("div", { class: "editgrid" });
    for (const k of D.STATS.concat(["Sv", "Ward"])) {
      grid.append(el("label", {}, [k, el("input", { value: u.profile[k] == null ? "" : u.profile[k], inputmode: "numeric",
        onchange: (e) => { u.profile[k] = e.target.value === "" ? (k === "Sv" || k === "Ward" ? null : "") : parseInt(e.target.value, 10); save(); render(); } })]));
    }
    body.append(grid);
    const row2 = el("div", { class: "editmeta" }, [
      el("label", {}, ["Category", selectFrom(["Characters", "Core", "Special", "Rare", "Allies"], u.category, (v) => { u.category = v; save(); render(); })]),
      el("label", {}, ["Models", el("input", { value: u.models, inputmode: "numeric", onchange: (e) => { u.models = parseInt(e.target.value, 10) || 1; save(); render(); } })]),
      el("label", {}, ["Unit width", el("input", { value: u.width, inputmode: "numeric", onchange: (e) => { u.width = parseInt(e.target.value, 10) || 1; save(); render(); } })]),
      el("label", { class: "chk" }, [el("input", { type: "checkbox", checked: u.isChar ? "checked" : null, onchange: (e) => { u.isChar = e.target.checked; save(); render(); } }), "Single model / character"]),
    ]);
    body.append(row2);

    // Mount profile editing
    body.append(el("h4", {}, "Mount"));
    const mountRow = el("div", { class: "editmeta" }, [
      el("label", {}, ["Mount name", el("input", { value: u.mount || "", placeholder: "e.g. Chaos Dragon",
        onchange: (e) => { u.mount = e.target.value.trim() || null; if (u.mount && !u.mountProfile) u.mountProfile = blankProfile(); if (!u.mount) u.mountProfile = null; save(); editModalRefresh(u); } })]),
    ]);
    body.append(mountRow);
    if (u.mountProfile) {
      body.append(el("p", { class: "muted small", html: "Use <b>+N</b> for stats the mount adds to the rider (e.g. T <b>+1</b>, W <b>+6</b>), a plain number for the mount's own stat (Movement &amp; its attacks), or <b>-</b> for none." }));
      const mgrid = el("div", { class: "editgrid" });
      for (const k of D.STATS) {
        mgrid.append(el("label", {}, [k, el("input", { value: u.mountProfile[k] == null ? "" : u.mountProfile[k],
          onchange: (e) => {
            let v = e.target.value.trim();
            if (v === "" || v === "-") u.mountProfile[k] = null;
            else if (/^\(?\+\s*\d+\)?$/.test(v)) u.mountProfile[k] = "+" + v.replace(/\D/g, "");
            else if (/^-?\d+$/.test(v)) u.mountProfile[k] = parseInt(v, 10);
            else u.mountProfile[k] = v;
            save(); render();
          } })]));
      }
      body.append(mgrid);
    }

    body.append(el("label", { class: "full" }, ["Options / equipment", el("textarea", { rows: 3, onchange: (e) => { u.options = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean); save(); } }, u.options.join("\n"))]));
    body.append(el("label", { class: "full" }, ["Notes", el("textarea", { rows: 2, placeholder: "Your own battle notes…", onchange: (e) => { u.notes = e.target.value; save(); } }, u.notes || "")]));
    openModal("Edit — " + (u.name || "unit"), body, [el("button", { onclick: () => { closeModal(); render(); } }, "Done")]);
  }

  function blankProfile() { return { M: "", WS: "", BS: "", S: "", T: "", W: "", I: "", A: "", Ld: "", Sv: null, Ward: null }; }
  function editModalRefresh(u) { render(); editModal(u); // reopen to reflect mount add/remove
  }

  function selectFrom(opts, val, cb) {
    const s = el("select", { onchange: (e) => cb(e.target.value) });
    for (const o of opts) s.append(el("option", { value: o, selected: o === val ? "selected" : null }, o));
    return s;
  }

  function editGazeTable() {
    const body = el("div", {});
    body.append(el("p", { class: "muted small" }, "Edit each result's name and mods (e.g. 'S+1, A+1, ward5'). The roll column accepts numbers or ranges (e.g. 3-4, 6+)."));
    const list = el("div", {});
    for (const r of DB.gaze) {
      const row = el("div", { class: "gazeedit" }, [
        el("input", { class: "roll", value: r.roll, onchange: (e) => { r.roll = e.target.value; save(); } }),
        el("input", { class: "rname", value: r.name, onchange: (e) => { r.name = e.target.value; save(); } }),
        el("input", { class: "rmods", value: modsToString(r), placeholder: "S+1, ward5", onchange: (e) => { r.mods = parseModString(e.target.value); r.rules = extractRules(e.target.value); save(); } }),
      ]);
      list.append(row);
    }
    body.append(list);
    const foot = [
      el("button", { class: "ghost danger", onclick: () => { if (confirm("Reset Gaze table to defaults?")) { DB.gaze = clone(D.GAZE_REWARDS); save(); editGazeTable(); } } }, "Reset defaults"),
      el("button", { onclick: closeModal }, "Done"),
    ];
    openModal("Edit Gaze of the Gods table", body, foot);
  }
  function modsToString(r) {
    const parts = [];
    for (const k in (r.mods || {})) parts.push(k + (r.mods[k] > 0 ? "+" : "") + r.mods[k]);
    return parts.join(", ");
  }
  function extractRules(s) {
    // keep any comma-separated token that isn't a recognised mod as a rule
    const rules = [];
    for (const tok of String(s).split(/[,;]+/)) {
      const t = tok.trim();
      if (t && !/^(M|WS|BS|S|T|W|I|A|Ld|Sv|Ward)\s*[+-]?\d+$/i.test(t)) rules.push(t);
    }
    return rules;
  }

  function importModal() {
    const body = el("div", {});
    body.append(el("p", { class: "muted small", html: "Import your army from Old World Builder. Best results: <b>Export → as JSON</b> and choose the <code>.owb.json</code> file below. You can also paste the JSON or a plain-text list." }));

    const preview = el("div", { class: "preview muted small" });
    function showPreview(input) {
      const r = P.parse(input);
      const matched = r.units.filter((u) => u.matched).length;
      preview.innerHTML = r.units.length
        ? `Found <b>${r.units.length}</b> units · <b>${matched}</b> matched to stat lines${r.meta && r.meta.name ? ` · <b>${r.meta.name}</b>` : ""}`
        : "Nothing recognised yet.";
      return r;
    }

    const file = el("input", { type: "file", accept: ".json,.owb.json,application/json,text/plain" });
    file.addEventListener("change", () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { ta.value = String(reader.result || ""); showPreview(ta.value); };
      reader.readAsText(f);
    });
    body.append(el("label", { class: "filerow" }, ["Choose .owb.json file", file]));

    const ta = el("textarea", { class: "import", rows: 10, placeholder: 'Paste your OWB JSON here, e.g. {"name":"My List","army":"warriors-of-chaos","characters":[...],"core":[...]}\n\n…or a plain-text list.' });
    ta.addEventListener("input", () => showPreview(ta.value));
    body.append(ta);
    body.append(preview);
    const foot = [
      el("label", { class: "chk" }, [el("input", { type: "checkbox", id: "imp-newarmy", checked: "checked" }), "Import as a new army"]),
      el("button", { class: "primary", onclick: () => {
        const r = P.parse(ta.value);
        if (!r.units.length) { alert("Couldn't find any units in that text."); return; }
        if ($("#imp-newarmy").checked) {
          const a = newArmy((r.meta && r.meta.name) || "Imported army");
          a.meta = { name: (r.meta && r.meta.name) || "Imported army", points: (r.meta && r.meta.points) || "" };
          a.units = r.units;
          a.faction = r.faction || "warriors-of-chaos";
          DB.armies.push(a); DB.activeId = a.id; state = activeArmy();
        } else {
          state.units = r.units;
          state.faction = r.faction || state.faction || "warriors-of-chaos";
          if (r.meta && r.meta.name) state.meta = r.meta;
        }
        save(); render(); closeModal();
      } }, "Import"),
    ];
    openModal("Import army list", body, foot);
  }

  // ---- top bar actions -----------------------------------------------------
  // Advance to the next turn: remove non-permanent additions (spells that last
  // "until your next turn" or "until end of turn"). Lasting Gaze rewards, items,
  // "remains in play" spells and permanent effects are kept.
  function nextTurn() {
    let n = 0;
    for (const u of state.units) {
      const before = (u.effects || []).length;
      u.effects = (u.effects || []).filter((e) => !/next turn|end of turn/i.test(e.duration || ""));
      n += before - u.effects.length;
      u.rolled = null; // clear rolled random values for the new turn
    }
    state.turn = (state.turn || 1) + 1;
    save(); render();
    flash("Turn " + state.turn + (n ? " — cleared " + n + " temporary effect(s)" : ""));
    // compulsory start-of-turn reminders
    const rem = [];
    for (const u of state.units) {
      if (unitGone(u)) continue;
      const txt = (u.baseRules || []).join(" ") + " " + (u.notes || "") + " " + (u.mark && D.MARKS[u.mark] ? D.MARKS[u.mark].rules.join(" ") : "");
      const reasons = REMINDERS.filter(([re]) => re.test(txt)).map(([, label]) => label);
      if (reasons.length) rem.push({ name: u.name || "Unit", reasons });
    }
    if (rem.length) {
      const body = el("div", {});
      body.append(el("p", { class: "muted small" }, "Things your units owe at the start of Turn " + state.turn + ":"));
      const list = el("div", { class: "remlist" });
      for (const r of rem) list.append(el("div", { class: "remrow" }, [el("b", {}, r.name), el("span", { class: "muted small" }, r.reasons.join(" · "))]));
      body.append(list);
      openModal("⚔ Turn " + state.turn + " — checklist", body, [el("button", { class: "primary", onclick: closeModal }, "Got it")]);
    }
  }
  function flash(msg) {
    const t = el("div", { class: "toast" }, msg);
    document.body.append(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 1800);
  }

  // Manual "Check for updates": force the service worker to look for a new
  // version and, if one is ready, activate it (controllerchange then reloads).
  function checkForUpdate() {
    if (!("serviceWorker" in navigator)) { location.reload(); return; }
    flash("Checking for updates…");
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) { location.reload(); return; }
      const activate = (w) => w && w.postMessage({ type: "SKIP_WAITING" });
      return reg.update().then(() => {
        if (reg.waiting) { activate(reg.waiting); return; }      // update ready → apply
        if (reg.installing) {                                     // still downloading → apply when ready
          reg.installing.addEventListener("statechange", function () {
            if (this.state === "installed" && reg.waiting) activate(reg.waiting);
          });
          return;
        }
        flash("You're on the latest version (" + APP_VERSION + ")");
      });
    }).catch(() => flash("Update check failed — check your connection"));
  }

  // Reset combat state for the current army (keep roster, marks and magic items).
  function newBattle() {
    if (!confirm("Start a new battle for “" + (state.meta.name || "this army") + "”?\nClears wounds, casualties, Gaze rewards and spells (keeps the roster, marks & items).")) return;
    for (const u of state.units) {
      u.modelsLost = 0; u.woundsLost = 0; u.mountWoundsLost = 0;
      u.rewards = []; u.effects = []; u.status = null;
    }
    state.turn = 1;
    save(); render();
    flash("New battle — combat state cleared.");
  }

  function collapseAll() {
    const anyOpen = state.units.some((u) => !u.collapsed);
    for (const u of state.units) u.collapsed = anyOpen;
    save(); render();
  }

  // Download the whole database (all armies) as a JSON backup file.
  function backup() {
    try {
      const data = JSON.stringify(DB, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = $("#dlAnchor");
      const d = new Date();
      const stamp = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      a.href = url; a.download = "chaostracker-backup-" + stamp + ".json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash("Backup downloaded (" + DB.armies.length + " army/ies).");
    } catch (e) { alert("Backup failed: " + e.message); }
  }

  // Restore armies from a backup file, merged in (existing armies are kept).
  function restoreFromObject(obj) {
    let armies = [];
    if (obj && Array.isArray(obj.armies)) armies = obj.armies;
    else if (obj && (obj.units || obj.meta)) armies = [{ meta: obj.meta || { name: "Imported", points: "" }, units: obj.units || [], turn: obj.turn || 1 }];
    if (!armies.length) { alert("No armies found in that file."); return; }
    for (const a of armies) {
      a.id = newId();
      if (!a.meta) a.meta = { name: "Imported army", points: "" };
      if (!a.units) a.units = [];
      if (!a.turn) a.turn = 1;
      if (!a.faction) a.faction = "warriors-of-chaos";
      const fd = factionData(a.faction);
      for (const u of a.units) if (!u.items) u.items = P.linkItems(u.options || [], fd);
    }
    DB.armies = DB.armies.concat(armies);
    DB.activeId = armies[0].id; state = activeArmy();
    save(); render();
    flash("Restored " + armies.length + " army/ies.");
  }
  function helpModal() {
    const body = el("div", { class: "help" });
    body.innerHTML =
      "<p class='muted small'>A live battle tracker for Warriors of Chaos. Everything saves on this device.</p>" +
      "<h4>Stats</h4><p class='small'>Each unit shows its live profile. A changed characteristic turns <b style='color:#69c98a'>green ▲</b> when improved and <b style='color:#e0685c'>red ▼</b> when worsened, with the original value beneath. Characteristics cap at 10.</p>" +
      "<h4>Extra lines</h4><p class='small'>🐎 <b>Mount</b> shows the mount's own profile; its <b>(+N)</b> bonuses are already folded into the rider above. <b>Ch ★</b> shows only the champion's differing stats.</p>" +
      "<h4>Casualties &amp; status</h4><p class='small'><b>−</b> takes a wound / removes a model, <b>+</b> restores. Tap the number to set it exactly. The <b>⚑ Fleeing / ↩ Fled off / ☠ Dead</b> buttons set a unit's status for Victory Points; badges flag <b>¼ strength</b> (worth ½ VP), ½ strength, Fleeing, Fled and Destroyed. The summary lists what the foe scores from your losses (incl. General / BSB down).</p>" +
      "<h4>Turn</h4><p class='small'><b>Next ▶</b> advances the turn, clears spells lasting “until your next turn / end of turn”, and pops a checklist of compulsory tests your units owe (Stupidity, Frenzy, Random Movement…). Lasting Gaze rewards, items and remains-in-play spells stay.</p>" +
      "<h4>Random values</h4><p class='small'>Units with random Movement/Attacks (Spawn, Forsaken…) get a <b>🎲 Roll</b> button to roll them for the turn.</p>" +
      "<h4>Gaze &amp; Spells</h4><p class='small'>👁 <b>Gaze</b> (characters with the rule): roll a D6 or pick a result. ✦ <b>Spell</b>: pick a lore spell or building block; augments/hexes change stats live. Magic items from your imported list apply automatically (shown as ⚜ chips).</p>" +
      "<h4>Armies</h4><p class='small'>Use the dropdown to switch armies; the ☰ menu has Import, New / Rename / Delete, New battle (reset combat state), and <b>Backup / Restore</b> to a file.</p>" +
      "<p class='muted small'>Tap any special-rule tag to open its page on tow.whfb.app. Unofficial fan tool; values are editable defaults — verify against your book.</p>";
    openModal("How to use", body, [el("button", { onclick: closeModal }, "Got it")]);
  }

  function restore() {
    const inp = $("#restoreFile");
    inp.value = "";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { try { restoreFromObject(JSON.parse(String(reader.result))); } catch (e) { alert("Couldn't read that file: " + e.message); } };
      reader.readAsText(f);
    };
    inp.click();
  }

  // ---- wire up -------------------------------------------------------------
  function init() {
    $("#btnImport").addEventListener("click", importModal);
    $("#btnNextTurn").addEventListener("click", nextTurn);
    $("#btnPrevTurn").addEventListener("click", () => { if ((state.turn || 1) > 1) { state.turn--; save(); render(); flash("Turn " + state.turn); } });
    $("#btnReset").addEventListener("click", () => {
      if (confirm("Clear all units from “" + (state.meta.name || "this army") + "”? This can't be undone.")) {
        state.units = []; state.turn = 1; save(); render();
      }
    });
    // army management
    $("#armySel").addEventListener("change", (e) => { DB.activeId = e.target.value; state = activeArmy(); save(); render(); });
    $("#btnNewArmy").addEventListener("click", () => {
      const name = (prompt("Name this army:", "New Army") || "").trim();
      if (name === null) return;
      const a = newArmy(name || "New Army");
      DB.armies.push(a); DB.activeId = a.id; state = activeArmy();
      save(); render();
    });
    $("#btnDelArmy").addEventListener("click", () => {
      if (DB.armies.length <= 1) { flash("You need at least one army."); return; }
      if (!confirm("Delete army “" + (state.meta.name || "this army") + "” and all its units?")) return;
      DB.armies = DB.armies.filter((a) => a.id !== DB.activeId);
      DB.activeId = DB.armies[0].id; state = activeArmy();
      save(); render();
    });
    $("#btnRenameArmy").addEventListener("click", () => {
      const name = prompt("Rename army:", state.meta.name || "");
      if (name == null) return;
      state.meta.name = name.trim() || state.meta.name;
      save(); render();
    });
    $("#btnNewBattle").addEventListener("click", newBattle);
    $("#btnCollapseAll").addEventListener("click", collapseAll);
    $("#btnBackup").addEventListener("click", backup);
    $("#btnRestore").addEventListener("click", restore);
    $("#btnHelp").addEventListener("click", helpModal);
    const bu = $("#btnUpdate"); if (bu) bu.addEventListener("click", checkForUpdate);
    // view tabs (Roster / Scoring)
    const tr = $("#tabRoster"); if (tr) tr.addEventListener("click", () => setView("roster"));
    const ts = $("#tabScoring"); if (ts) ts.addEventListener("click", () => setView("scoring"));
    const bs = $("#btnScoring"); if (bs) bs.addEventListener("click", () => setView("scoring"));
    const ver = $("#appVer"); if (ver) ver.textContent = "ChaosTracker26 · " + APP_VERSION + " · " + APP_DATE;
    // menu open/close
    const menuPanel = $("#menuPanel");
    const toggleMenu = (open) => { if (!menuPanel) return; const show = open == null ? menuPanel.hasAttribute("hidden") : open; if (show) menuPanel.removeAttribute("hidden"); else menuPanel.setAttribute("hidden", ""); };
    $("#btnMenu").addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
    if (menuPanel) menuPanel.addEventListener("click", () => toggleMenu(false));
    document.addEventListener("click", (e) => { const m = $(".menu"); if (m && !m.contains(e.target)) toggleMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { toggleMenu(false); closeModal(); } });
    // Condense the sticky header once the page is scrolled.
    const topbar = $(".topbar");
    const onScroll = () => { if (topbar) topbar.classList.toggle("compact", window.scrollY > 6); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    render();

    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      // Show a "tap to refresh" bar when a newer version is ready, rather than
      // reloading mid-game. Tapping activates the waiting worker; controllerchange
      // then reloads once. (Data lives in localStorage, so a reload is safe.)
      const showUpdateBanner = (worker) => {
        if (!worker || document.getElementById("updatebar")) return;
        const bar = el("button", {
          id: "updatebar", class: "updatebar", type: "button",
          onclick: () => {
            bar.disabled = true;
            bar.textContent = "Updating…";
            worker.postMessage({ type: "SKIP_WAITING" });
          },
        }, "🔄 Update available — tap to refresh");
        document.body.appendChild(bar);
      };
      navigator.serviceWorker.register("service-worker.js").then((reg) => {
        // check for a newer version whenever the app is opened/focused
        reg.update().catch(() => {});
        window.addEventListener("focus", () => reg.update().catch(() => {}));
        // a newer worker was already downloaded while the app was closed
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
        // a newer worker finished downloading while the app is open
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner(nw);
          });
        });
      }).catch(() => {});
      // when the new worker takes control (after the user taps), reload once
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return; reloading = true; location.reload();
      });
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
