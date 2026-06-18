/*
 * ChaosTracker26 — main app logic.
 * Plain DOM, no framework, no build step. State persists to localStorage and
 * every visible stat is derived live from: base profile + mark + Gaze of the
 * Gods rewards + active spell effects + casualties.
 */
(function () {
  "use strict";
  const D = window.WOC_DATA;
  const P = window.WOC_PARSER;
  const STORE_KEY = "chaostracker26.v1";
  const APP_VERSION = "v21"; // shown in the footer; matches the service-worker cache
  const GAZE_VERSION = 2; // bump to roll out a corrected default Gaze table
  const MOUNT_VERSION = 2; // bump to re-apply corrected mount profiles to saved armies
  const UNIT_VERSION = 2;  // bump to re-apply corrected unit profiles to saved armies
  const ITEMS_VERSION = 1; // bump to re-link items/traits from wargear on saved armies

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function rawLoad() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }
  function newId() { return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function newArmy(name) { return { id: newId(), meta: { name: name || "My Army", points: "" }, units: [], turn: 1 }; }

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
  for (const a of DB.armies) { if (!a.id) a.id = newId(); if (!a.meta) a.meta = { name: "My Army", points: "" }; if (!a.units) a.units = []; if (!a.turn) a.turn = 1; for (const u of a.units) { if (u.fleeing && !u.status) { u.status = "fleeing"; delete u.fleeing; } } }
  if (!DB.activeId || !activeArmy()) DB.activeId = DB.armies[0].id;
  if (!DB.gaze || DB.gazeVersion !== GAZE_VERSION) { DB.gaze = clone(D.GAZE_REWARDS); DB.gazeVersion = GAZE_VERSION; save(); }
  if (DB.unitVersion !== UNIT_VERSION) {
    for (const a of DB.armies) for (const u of a.units) {
      const def = P.matchUnit(u.name);
      if (def) { u.profile = clone(def.profile); u.isChar = !!def.isChar; u.notes = def.note || ""; }
    }
    DB.unitVersion = UNIT_VERSION; save();
  }
  if (DB.mountVersion !== MOUNT_VERSION) {
    for (const a of DB.armies) for (const u of a.units) {
      if (!u.mount) continue;
      const mdef = D.MOUNT_INDEX[D.norm(u.mount)] || D.MOUNT_INDEX[D.norm(u.mount).replace(/s$/, "")];
      if (mdef) { u.mountProfile = clone(mdef.profile); u.mountNote = mdef.note || null; }
    }
    DB.mountVersion = MOUNT_VERSION; save();
  }
  if (DB.itemsVersion !== ITEMS_VERSION) {
    for (const a of DB.armies) for (const u of a.units) { if (!u.items || !u.items.length) u.items = P.linkItems(u.options || []); }
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
  function effective(unit, baseOverride) {
    const prof = baseOverride ? Object.assign({}, unit.profile, baseOverride) : unit.profile;
    const base = foldMount(prof, unit.mountProfile);
    const eff = {};
    for (const k of D.STATS) {
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

  function render() {
    $("#armyPoints").textContent = state.meta.points ? state.meta.points + " pts" : "";
    const tb = $("#turnNum"); if (tb) tb.textContent = state.turn || 1;
    const pv = $("#btnPrevTurn"); if (pv) pv.disabled = (state.turn || 1) <= 1;
    const sel = $("#armySel");
    if (sel) {
      sel.innerHTML = "";
      for (const a of DB.armies) sel.append(el("option", { value: a.id, selected: a.id === DB.activeId ? "selected" : null }, (a.meta && a.meta.name) || "(unnamed)"));
    }
    const del = $("#btnDelArmy"); if (del) del.disabled = DB.armies.length <= 1;
    const root = $("#roster");
    root.innerHTML = "";
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
    const def = P.matchUnit(u.name);
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
    const markSel = el("select", { class: "mark", onchange: (e) => { u.mark = e.target.value || null; save(); render(); } });
    markSel.append(el("option", { value: "" }, "No mark"));
    for (const k in D.MARKS) markSel.append(el("option", { value: k, selected: u.mark === k ? "selected" : null }, D.MARKS[k].name));
    const delBtn = el("button", { class: "icon danger", title: "Remove unit", onclick: () => { if (confirm("Remove " + (u.name || "unit") + "?")) { state.units = state.units.filter((x) => x !== u); save(); render(); } } }, "✕");
    card.append(el("div", { class: "u-head" }, [caret, title, markSel, delBtn]));

    // status badges
    const badges = [];
    if (gone) badges.push(el("span", { class: "badge b-dead" }, status === "fled" ? "Fled off" : "Destroyed"));
    else if (fleeing) badges.push(el("span", { class: "badge b-flee" }, "⚑ Fleeing"));
    else if (quarter) badges.push(el("span", { class: "badge b-quarter" }, "¼ strength · ½ VP"));
    else if (half) badges.push(el("span", { class: "badge b-half" }, "½ strength"));
    if (badges.length) card.append(el("div", { class: "badges" }, badges));

    // stat line (always shown)
    const statsRow = el("div", { class: "stats" });
    for (const k of D.STATS) statsRow.append(statCell(k, eff[k], base[k]));
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
      track.append(stepper("Models", remModels, u.models,
        () => { if (u.modelsLost > 0) { u.modelsLost--; save(); render(); } },
        () => { if (u.modelsLost < u.models) { u.modelsLost++; save(); render(); } },
        (n) => { u.modelsLost = Math.max(0, Math.min(u.models, u.models - n)); save(); render(); }));
    }
    if (isSingle || multiWound) {
      track.append(stepper(u.mountProfile ? "Wounds*" : "Wounds", wrem, wmax,
        () => { if ((u.woundsLost || 0) > 0) { u.woundsLost--; save(); render(); } },
        () => { if ((u.woundsLost || 0) < wmax) { u.woundsLost = (u.woundsLost || 0) + 1; save(); render(); } },
        (n) => { u.woundsLost = Math.max(0, Math.min(wmax, wmax - n)); save(); render(); }));
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

    // rules / tags
    const hasTags = rules.length || (u.baseRules || []).length || u.mount;
    if (hasTags) {
      const tags = el("div", { class: "tags" });
      if (u.mount) tags.append(el("span", { class: "tag t-mount" }, "🐎 " + u.mount));
      for (const r of (u.baseRules || [])) tags.append(el("a", { class: "tag t-rule link", href: ruleLookupUrl(r), target: "_blank", rel: "noopener noreferrer", title: "Look up “" + r + "” on tow.whfb.app" }, r));
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

  function stepper(label, val, max, inc, dec, setTo) {
    const valEl = el("div", { class: "step-v" + (setTo ? " tappable" : ""), title: setTo ? "Tap to set exactly" : null,
      onclick: setTo ? () => { const n = prompt("Set " + label.replace("*", "") + " (0–" + max + "):", String(val)); if (n == null) return; const v = parseInt(n, 10); if (!isNaN(v)) setTo(Math.max(0, Math.min(max, v))); } : null,
    }, [el("b", {}, String(val)), el("span", { class: "muted" }, "/" + max)]);
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
          DB.armies.push(a); DB.activeId = a.id; state = activeArmy();
        } else {
          state.units = r.units;
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
    }
    state.turn = (state.turn || 1) + 1;
    save(); render();
    flash("Turn " + state.turn + (n ? " — cleared " + n + " temporary effect(s)" : ""));
  }
  function flash(msg) {
    const t = el("div", { class: "toast" }, msg);
    document.body.append(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 1800);
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
      for (const u of a.units) if (!u.items) u.items = P.linkItems(u.options || []);
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
      "<h4>Turn</h4><p class='small'><b>Next ▶</b> advances the turn and clears spells lasting “until your next turn / end of turn”. Lasting Gaze rewards, items and remains-in-play spells stay.</p>" +
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
    const ver = $("#appVer"); if (ver) ver.textContent = "ChaosTracker26 · " + APP_VERSION;
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
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
