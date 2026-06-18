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
  const GAZE_VERSION = 2; // bump to roll out a corrected default Gaze table
  const MOUNT_VERSION = 2; // bump to re-apply corrected mount profiles to saved armies
  const UNIT_VERSION = 2;  // bump to re-apply corrected unit profiles to saved armies
  const ITEMS_VERSION = 1; // bump to re-link items/traits from wargear on saved armies

  // ---- state ---------------------------------------------------------------
  let state = load() || { meta: { name: "My Army", points: "" }, units: [], turn: 1, gaze: clone(D.GAZE_REWARDS), gazeVersion: GAZE_VERSION, mountVersion: MOUNT_VERSION, unitVersion: UNIT_VERSION, itemsVersion: ITEMS_VERSION };
  if (!state.turn) state.turn = 1;
  // Migrate older saves to the corrected Gaze of the Gods table, persisting once.
  if (!state.gaze || state.gazeVersion !== GAZE_VERSION) {
    state.gaze = clone(D.GAZE_REWARDS);
    state.gazeVersion = GAZE_VERSION;
    save();
  }
  // Re-apply canonical unit profiles to matched units after a stat-data fix.
  if (state.unitVersion !== UNIT_VERSION) {
    for (const u of state.units || []) {
      const def = P.matchUnit(u.name);
      if (def) {
        u.profile = clone(def.profile);
        u.isChar = !!def.isChar;
        u.notes = def.note || "";
      }
    }
    state.unitVersion = UNIT_VERSION;
    save();
  }
  // Re-apply canonical mount profiles to existing units after a mount-data fix.
  if (state.mountVersion !== MOUNT_VERSION) {
    for (const u of state.units || []) {
      if (!u.mount) continue;
      const mdef = D.MOUNT_INDEX[D.norm(u.mount)] || D.MOUNT_INDEX[D.norm(u.mount).replace(/s$/, "")];
      if (mdef) { u.mountProfile = clone(mdef.profile); u.mountNote = mdef.note || null; }
    }
    state.mountVersion = MOUNT_VERSION;
    save();
  }
  // Auto-link gifts/items/traits from each unit's imported wargear.
  if (state.itemsVersion !== ITEMS_VERSION) {
    for (const u of state.units || []) {
      if (!u.items || !u.items.length) u.items = P.linkItems(u.options || []);
    }
    state.itemsVersion = ITEMS_VERSION;
    save();
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }

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
  function num(v) { const n = parseInt(v, 10); return isNaN(n) ? "" : n; }
  function findReward(rid) {
    if (typeof rid === "object") return rid; // inline custom reward
    return state.gaze.find((r) => r.id === rid);
  }
  function findItem(iid) {
    if (typeof iid === "object") return iid; // inline custom item
    return D.ITEMS.find((i) => i.id === iid);
  }

  function modelsRemaining(u) { return Math.max(0, (u.models || 0) - (u.modelsLost || 0)); }

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
    $("#armyName").value = state.meta.name || "";
    $("#armyPoints").textContent = state.meta.points ? state.meta.points + " pts" : "";
    const tb = $("#turnNum"); if (tb) tb.textContent = state.turn || 1;
    const pv = $("#btnPrevTurn"); if (pv) pv.disabled = (state.turn || 1) <= 1;
    const root = $("#roster");
    root.innerHTML = "";
    if (!state.units.length) {
      root.append(el("div", { class: "empty" }, [
        el("p", { html: "No units yet." }),
        el("p", { class: "muted", html: "Tap <b>Import list</b> to paste your Old World Builder army, or <b>Add unit</b> to build one by hand." }),
      ]));
      return;
    }
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
    const isSingle = u.isChar || u.models <= 1;
    const wmax = num(base.W) || 1;
    const wrem = Math.max(0, wmax - (u.woundsLost || 0));
    const dead = modelsRemaining(u) <= 0 || (isSingle && wrem <= 0);
    const card = el("div", { class: "card mark-" + (u.mark || "none") + (dead ? " dead" : "") });

    // header
    const title = el("input", {
      class: "u-name", value: u.name, placeholder: "Unit name",
      onchange: (e) => { u.name = e.target.value; save(); },
    });
    const markSel = el("select", { class: "mark", onchange: (e) => { u.mark = e.target.value || null; save(); render(); } });
    markSel.append(el("option", { value: "" }, "No mark"));
    for (const k in D.MARKS) markSel.append(el("option", { value: k, selected: u.mark === k ? "selected" : null }, D.MARKS[k].name));
    card.append(el("div", { class: "u-head" }, [
      title,
      markSel,
      el("button", { class: "icon danger", title: "Remove unit", onclick: () => { if (confirm("Remove " + (u.name || "unit") + "?")) { state.units = state.units.filter((x) => x !== u); save(); render(); } } }, "✕"),
    ]));

    // stat line
    const statsRow = el("div", { class: "stats" });
    for (const k of D.STATS) statsRow.append(statCell(k, eff[k], base[k]));
    statsRow.append(statCell("Sv", eff.Sv ? eff.Sv + "+" : "–", base.Sv ? base.Sv + "+" : "", true));
    statsRow.append(statCell("Wd", eff.Ward ? eff.Ward + "+" : "–", base.Ward ? base.Ward + "+" : "", true));
    card.append(statsRow);

    // mount line — shown as the mount's own printed profile; "(+N)" entries are
    // already folded into the rider's line above (its actual T/W/M).
    if (u.mountProfile) {
      const mp = u.mountProfile;
      const mRow = el("div", { class: "stats mount" });
      // 9 stat cells aligned under the model's M..Ld
      for (const k of D.STATS) {
        const add = typeof mp[k] === "string" && /^\+/.test(mp[k]);
        mRow.append(el("div", { class: "stat" + (add ? " mountadd" : "") }, [
          el("div", { class: "stat-l" }, k),
          el("div", { class: "stat-v mlbl" }, fmtMount(mp[k])),
        ]));
      }
      mRow.append(el("div", { class: "stat ghostcell" })); // under Sv
      // mount marker sits at the end, under the Ward (Wd) column
      mRow.append(el("div", { class: "stat mlabel" }, [el("div", { class: "stat-l" }, "Mt"), el("div", { class: "stat-v mlbl" }, "🐎")]));
      card.append(mRow);
      if (u.mountNote) card.append(el("div", { class: "mountnote muted small" }, u.mountNote));
    }

    // champion secondary stat line (when the unit's champion has a different profile)
    const def = P.matchUnit(u.name);
    const optStr = (u.options || []).join(" ");
    const hasChampion = /champion|headman|headtaker|first sword|jarl|horsemaster/i.test(optStr);
    if (def && def.champ && (hasChampion || !(u.options || []).length)) {
      const champ = effective(u, def.champ).eff; // champion gets the same unit buffs, plus its own profile
      const cRow = el("div", { class: "stats champ" });
      for (const k of D.STATS) cRow.append(statCell(k, champ[k], eff[k]));
      cRow.append(el("div", { class: "stat ghostcell" })); // under Sv
      cRow.append(el("div", { class: "stat mlabel" }, [el("div", { class: "stat-l" }, "Ch"), el("div", { class: "stat-v mlbl" }, "★")]));
      card.append(cRow);
      if (def.champName) card.append(el("div", { class: "mountnote muted small" }, def.champName + " (champion)"));
    }

    // command models present (champion / standard / musician / BSB / general)
    const cmd = [];
    if (/general/i.test(optStr)) cmd.push("👑 General");
    if (/battle standard bearer/i.test(optStr)) cmd.push("⚑ Battle Standard");
    if (hasChampion) cmd.push("★ Champion");
    if (!/battle standard bearer/i.test(optStr) && /standard bearer/i.test(optStr)) cmd.push("⚑ Standard");
    if (/musician/i.test(optStr)) cmd.push("♪ Musician");
    if (cmd.length) card.append(el("div", { class: "cmdline" }, cmd.map((c) => el("span", { class: "cmdchip" }, c))));

    // casualties / wounds tracker
    const track = el("div", { class: "track" });
    const multiWound = num(base.W) > 1;
    if (!isSingle) {
      // + restores a model, − removes one (matches the remaining count shown)
      track.append(stepper("Models", modelsRemaining(u), u.models,
        () => { if (u.modelsLost > 0) { u.modelsLost--; save(); render(); } },
        () => { if (u.modelsLost < u.models) { u.modelsLost++; save(); render(); } }));
    }
    if (isSingle || multiWound) {
      // + heals a wound, − takes a wound (matches the remaining count shown)
      track.append(stepper(u.mountProfile ? "Wounds*" : "Wounds", wrem, wmax,
        () => { if ((u.woundsLost || 0) > 0) { u.woundsLost--; save(); render(); } },
        () => { if ((u.woundsLost || 0) < wmax) { u.woundsLost = (u.woundsLost || 0) + 1; save(); render(); } }));
    }
    card.append(track);

    // rules / tags: mount, static special rules, then live mark/reward/effect rules
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

    // action buttons
    const canGaze = !!(def && def.gaze) || /gaze of the gods/i.test((u.baseRules || []).join(" ") + " " + (u.notes || ""));
    card.append(el("div", { class: "u-actions" }, [
      canGaze ? el("button", { class: "act gaze", onclick: () => gazeModal(u) }, "👁 Gaze") : null,
      el("button", { class: "act spell", onclick: () => effectModal(u) }, "✦ Spell"),
      el("button", { class: "act item", onclick: () => itemsModal(u) }, "⚜ Items"),
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

  function stepper(label, val, max, inc, dec) {
    return el("div", { class: "stepper" }, [
      el("div", { class: "step-l" }, label),
      el("div", { class: "step-c" }, [
        el("button", { class: "round minus", onclick: dec }, "−"),
        el("div", { class: "step-v" }, [el("b", {}, String(val)), el("span", { class: "muted" }, "/" + max)]),
        el("button", { class: "round plus", onclick: inc }, "+"),
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
        const r = state.gaze.find((x) => rollMatches(x.roll, roll)) || state.gaze[Math.min(state.gaze.length - 1, roll - 1)];
        last.innerHTML = "";
        last.append(el("div", { class: "rolled" }, [el("b", {}, "D6 = " + roll + " → "), r ? r.name : "—"]));
        if (r) applyReward(u, r);
      } }, "🎲 Roll D6"),
      last,
    ]));
    const list = el("div", { class: "picklist" });
    for (const r of state.gaze) {
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

  function itemsModal(u) {
    const body = el("div", {});
    body.append(el("p", { class: "muted small", html: "Gifts, magic items &amp; chaotic traits. Tap to add to this model — stat effects apply live; others show as a reminder tag. Tap an active item's × on the card to remove." }));
    for (const [cat, label] of D.ITEM_CATEGORIES) {
      const list = el("div", { class: "picklist" });
      for (const it of D.ITEMS.filter((x) => x.cat === cat)) {
        const has = (u.items || []).indexOf(it.id) !== -1;
        list.append(el("button", { class: "pick item" + (has ? " on" : ""), onclick: () => {
          u.items = u.items || [];
          if (has) u.items = u.items.filter((x) => x !== it.id); else u.items.push(it.id);
          save(); render(); itemsModal(u);
        } }, [
          el("b", {}, (has ? "✓ " : "") + it.name),
          el("span", { class: "muted small" }, describeMods(it)),
        ]));
      }
      body.append(el("h4", {}, label));
      body.append(list);
    }
    openModal("Items & traits — " + (u.name || "unit"), body, [el("button", { onclick: closeModal }, "Done")]);
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
    for (const r of state.gaze) {
      const row = el("div", { class: "gazeedit" }, [
        el("input", { class: "roll", value: r.roll, onchange: (e) => { r.roll = e.target.value; save(); } }),
        el("input", { class: "rname", value: r.name, onchange: (e) => { r.name = e.target.value; save(); } }),
        el("input", { class: "rmods", value: modsToString(r), placeholder: "S+1, ward5", onchange: (e) => { r.mods = parseModString(e.target.value); r.rules = extractRules(e.target.value); save(); } }),
      ]);
      list.append(row);
    }
    body.append(list);
    const foot = [
      el("button", { class: "ghost danger", onclick: () => { if (confirm("Reset Gaze table to defaults?")) { state.gaze = clone(D.GAZE_REWARDS); save(); editGazeTable(); } } }, "Reset defaults"),
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
      el("label", { class: "chk" }, [el("input", { type: "checkbox", id: "imp-replace", checked: "checked" }), "Replace current army"]),
      el("button", { class: "primary", onclick: () => {
        const r = P.parse(ta.value);
        if (!r.units.length) { alert("Couldn't find any units in that text."); return; }
        if ($("#imp-replace").checked) state.units = r.units; else state.units = state.units.concat(r.units);
        if (r.meta.name) state.meta = r.meta;
        save(); render(); closeModal();
      } }, "Import"),
    ];
    openModal("Import army list", body, foot);
  }

  // ---- top bar actions -----------------------------------------------------
  function addUnit() {
    const u = P.newUnit();
    u.name = "New unit";
    state.units.push(u);
    save(); render();
    editModal(u);
  }
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

  // ---- wire up -------------------------------------------------------------
  function init() {
    $("#btnImport").addEventListener("click", importModal);
    $("#btnAdd").addEventListener("click", addUnit);
    $("#btnNextTurn").addEventListener("click", nextTurn);
    $("#btnPrevTurn").addEventListener("click", () => { if ((state.turn || 1) > 1) { state.turn--; save(); render(); flash("Turn " + state.turn); } });
    $("#btnReset").addEventListener("click", () => {
      if (confirm("Clear the whole army? This can't be undone.")) {
        state = { meta: { name: "My Army", points: "" }, units: [], turn: 1, gaze: clone(D.GAZE_REWARDS), gazeVersion: GAZE_VERSION, mountVersion: MOUNT_VERSION, unitVersion: UNIT_VERSION, itemsVersion: ITEMS_VERSION };
        save(); render();
      }
    });
    $("#armyName").addEventListener("change", (e) => { state.meta.name = e.target.value; save(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    render();

    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
