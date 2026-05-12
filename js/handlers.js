// ================================================================
// EDIT MODE
// ================================================================

let editMode = null; // 'info' | 'komponenten' | 'einstellungen' | 'geometrie'

function toggleEditMode(t) {
  editMode = editMode === t ? null : t;
  switchTab(t);
}

// ---- Global field rename ----
function renameCompField(oldName, newName) {
  if (!newName || newName === oldName) return;
  state.bikes.forEach(b => {
    b.components.forEach(c => {
      if (c.name === oldName) {
        c.name = newName;
      }
    });
  });
  COMP_GROUPS.forEach(g => {
    const i = g.items.indexOf(oldName);
    if (i >= 0) g.items[i] = newName;
  });
  markDirty('Felder');
  switchTab('komponenten');
}

function renameSetField(oldLabel, newLabel) {
  if (!newLabel || newLabel === oldLabel) return;
  if (SETTING_COMP_MAP[oldLabel]) {
    SETTING_COMP_MAP[newLabel] = SETTING_COMP_MAP[oldLabel];
    delete SETTING_COMP_MAP[oldLabel];
  }
  state.bikes.forEach(b => {
    b.settings.forEach(s => {
      if (s.label === oldLabel) s.label = newLabel;
    });
  });
  markDirty('Felder');
  switchTab('einstellungen');
}

function renameGeoField(defId, newLabel, newUnit) {
  const def = state.geoDefs.find(d => d.id === defId);
  if (!def) return;
  def.label = newLabel;
  def.unit = newUnit;
  markDirty('Felder');
  switchTab('geometrie');
}

// ---- Delete with confirmation ----
function deleteCompField(name) {
  const count = state.bikes.reduce((a, b) => {
    const c = b.components.find(c => c.name === name);
    return a + (c && c.history.length ? 1 : 0);
  }, 0);
  const msg =
    count > 0
      ? `Es existieren Daten für ${count} Bike(s) im Feld "${name}".\nFeld und alle Daten wirklich löschen?`
      : `Feld "${name}" löschen?`;
  if (!confirm(msg)) return;
  COMP_GROUPS.forEach(g => {
    g.items = g.items.filter(i => i !== name);
  });
  state.bikes.forEach(b => {
    b.components = b.components.filter(c => c.name !== name);
  });
  markDirty('Felder');
  switchTab('komponenten');
}

function deleteSetField(label) {
  const count = state.bikes.reduce((a, b) => {
    const s = b.settings.find(s => s.label === label);
    return a + (s && s.history.length ? 1 : 0);
  }, 0);
  const msg =
    count > 0
      ? `Es existieren Daten für ${count} Bike(s) im Feld "${label}".\nFeld und alle Daten wirklich löschen?`
      : `Feld "${label}" löschen?`;
  if (!confirm(msg)) return;
  state.bikes.forEach(b => {
    b.settings = b.settings.filter(s => s.label !== label);
  });
  markDirty('Felder');
  switchTab('einstellungen');
}

function deleteGeoField(defId) {
  const def = state.geoDefs.find(d => d.id === defId);
  if (!def) return;
  const count = state.bikes.reduce((a, b) => {
    const g = b.geometry.find(g => g.defId === defId);
    return a + (g && g.history.length ? 1 : 0);
  }, 0);
  const msg =
    count > 0
      ? `Es existieren Daten für ${count} Bike(s) im Feld "${def.label}".\nFeld und alle Daten wirklich löschen?`
      : `Feld "${def.label}" löschen?`;
  if (!confirm(msg)) return;
  state.geoDefs = state.geoDefs.filter(d => d.id !== defId);
  state.bikes.forEach(b => {
    b.geometry = b.geometry.filter(g => g.defId !== defId);
  });
  markDirty('Felder');
  switchTab('geometrie');
}

function allCompNames() {
  const names = new Set();
  state.bikes.forEach(b =>
    b.components.forEach(c => {
      if (c.name) names.add(c.name);
    })
  );
  return [...names].sort((a, b) => a.localeCompare(b, 'de'));
}

function addCompField(group) {
  const suggestions = allCompNames()
    .map(n => `<option value="${esc(n)}">`)
    .join('');
  showModal(
    'addcomp-modal',
    `
    <div class="modal-header"><div><div class="modal-sub">${esc(group)}</div><div class="modal-title">Neues Feld</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('addcomp-modal')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="addcomp-group" value="${esc(group)}">
      <div class="form-group"><label class="form-label">Feldname</label>
        <input class="form-input" id="addcomp-name" list="addcomp-list" placeholder="z.B. Gabel, Kassette, Bremsbeläge vorne..." autocomplete="off" onkeydown="if(event.key==='Enter')confirmAddCompField()">
        <datalist id="addcomp-list">${suggestions}</datalist>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('addcomp-modal')">Abbrechen</button>
      <button class="btn btn-primary" onclick="confirmAddCompField()">Hinzufügen</button>
    </div>`
  );
  setTimeout(() => {
    const el = document.getElementById('addcomp-name');
    if (el) el.focus();
  }, 50);
}

function confirmAddCompField() {
  const group = vv('addcomp-group');
  const label = vv('addcomp-name').trim();
  if (!label) {
    showToast('Bitte einen Namen eingeben');
    return;
  }
  const g = COMP_GROUPS.find(g => g.group === group);
  if (!g) return;
  g.items.push(label);
  state.bikes.forEach(b => {
    b.components.push({ group, name: label, history: [], notVorhanden: false });
  });
  markDirty('Felder');
  closeModal('addcomp-modal');
  switchTab('komponenten');
}

function addSetField() {
  const label = prompt('Name des neuen Feldes:');
  if (!label || !label.trim()) return;
  const unit = prompt('Einheit (optional):') || '';
  const group = prompt('Gruppe (z.B. Gabel, Reifen, Eigene Felder):') || 'Eigene Felder';
  state.bikes.forEach(b => {
    b.settings.push({ label: label.trim(), unit, group, isStandard: false, history: [] });
  });
  markDirty('Felder');
  switchTab('einstellungen');
}

function addGeoField() {
  const label = prompt('Name des neuen Feldes:');
  if (!label || !label.trim()) return;
  const unit = prompt('Einheit (optional, z.B. mm, °):') || '';
  const group = prompt('Gruppe (z.B. Geometrie, Cockpit, Rahmen):') || 'Geometrie';
  const id = 'g' + uid();
  state.geoDefs.push({ id, label: label.trim(), unit, group });
  state.bikes.forEach(b => {
    b.geometry.push({ defId: id, history: [] });
  });
  markDirty('Felder');
  switchTab('geometrie');
}

// ================================================================
// DRAG & DROP
// ================================================================

let dnd = null;
const HSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';

function startDrag(e, type, idx, grpIdx) {
  e.preventDefault();
  e.stopPropagation();
  const handle = e.currentTarget;
  const row = handle.closest('[data-dnd-type]');
  if (!row) return;
  try {
    handle.setPointerCapture(e.pointerId);
  } catch (_) {}
  const rect = row.getBoundingClientRect();
  const ghost = row.cloneNode(true);
  ghost.id = 'dnd-ghost';
  Object.assign(ghost.style, {
    position: 'fixed',
    top: rect.top + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    zIndex: '9999',
    pointerEvents: 'none',
    opacity: '.88',
    boxShadow: '0 8px 28px rgba(0,0,0,.7)',
    background: 'var(--surface2)',
    border: '1.5px solid var(--accent)',
    borderRadius: '8px',
  });
  document.body.appendChild(ghost);
  row.classList.add('dnd-dragging');
  dnd = { type, fromIdx: idx, toIdx: idx, grpIdx, row, handle, ghostBaseTop: rect.top, startY: e.clientY };
  handle.addEventListener('pointermove', dndMove, { passive: false });
  handle.addEventListener('pointerup', dndEnd);
  handle.addEventListener('pointercancel', dndEnd);
}

function dndMove(e) {
  if (!dnd) return;
  e.preventDefault();
  const g = document.getElementById('dnd-ghost');
  if (g) g.style.top = dnd.ghostBaseTop + (e.clientY - dnd.startY) + 'px';
  if (g) g.style.visibility = 'hidden';
  const els = document.elementsFromPoint(e.clientX, e.clientY);
  if (g) g.style.visibility = '';
  document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
  for (const el of els) {
    const t = el.closest('[data-dnd-type="' + dnd.type + '"]');
    if (t && t !== dnd.row) {
      t.classList.add('dnd-over');
      dnd.toIdx = parseInt(t.dataset.dndIdx);
      break;
    }
  }
}

function dndEnd(e) {
  if (!dnd) return;
  const dndBackup = dnd;
  dnd = null;
  dndBackup.handle.removeEventListener('pointermove', dndMove);
  dndBackup.handle.removeEventListener('pointerup', dndEnd);
  dndBackup.handle.removeEventListener('pointercancel', dndEnd);
  const g = document.getElementById('dnd-ghost');
  if (g) g.remove();
  dndBackup.row.classList.remove('dnd-dragging');
  document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
  if (dndBackup.toIdx !== dndBackup.fromIdx) doReorder(dndBackup.type, dndBackup.fromIdx, dndBackup.toIdx, dndBackup.grpIdx);
}

function doReorder(type, from, to, grpIdx) {
  const b = getBike(bikeId);
  if (type === 'comp-group') {
    const gs = [...dndCompGrpNames];
    const [g] = gs.splice(from, 1);
    gs.splice(to, 0, g);
    const old = [...b.components];
    b.components = gs.flatMap(gn => old.filter(c => c.group === gn));
    markDirty('Gruppen');
    switchTab('komponenten');
  } else if (type === 'comp') {
    const grpName = dndCompGrpNames[grpIdx];
    if (!grpName) return;
    const old = [...b.components];
    const gc = old.filter(c => c.group === grpName);
    const [item] = gc.splice(from, 1);
    gc.splice(to, 0, item);
    const gs = compGroupOrder(old);
    b.components = gs.flatMap(g => (g === grpName ? gc : old.filter(c => c.group === g)));
    markDirty('Komponenten');
    switchTab('komponenten');
  } else if (type === 'setting-group') {
    const gs = [...dndSetGrpNames];
    const [g] = gs.splice(from, 1);
    gs.splice(to, 0, g);
    const old = [...b.settings];
    b.settings = gs.flatMap(gn => old.filter(s => (s.group || 'Sonstige') === gn));
    markDirty('Einstellungen');
    switchTab('einstellungen');
  } else if (type === 'setting') {
    const grpName = dndSetGrpNames[grpIdx];
    if (!grpName) return;
    const old = [...b.settings];
    const gc = old.filter(s => (s.group || 'Sonstige') === grpName);
    const [item] = gc.splice(from, 1);
    gc.splice(to, 0, item);
    const gs = setGroupOrder(old);
    b.settings = gs.flatMap(g => (g === grpName ? gc : old.filter(s => (s.group || 'Sonstige') === g)));
    markDirty('Einstellungen');
    switchTab('einstellungen');
  } else if (type === 'geo-group') {
    const gs = [...dndGeoGrpNames];
    const [g] = gs.splice(from, 1);
    gs.splice(to, 0, g);
    const old = [...state.geoDefs];
    state.geoDefs = gs.flatMap(gn => old.filter(d => (d.group || 'Geometrie') === gn));
    markDirty('Geometrie');
    switchTab('geometrie');
  } else if (type === 'geo') {
    const grpName = dndGeoGrpNames[grpIdx];
    if (!grpName) return;
    const old = [...state.geoDefs];
    const gc = old.filter(d => (d.group || 'Geometrie') === grpName);
    const [item] = gc.splice(from, 1);
    gc.splice(to, 0, item);
    const gs = [...new Set(old.map(d => d.group || 'Geometrie'))];
    state.geoDefs = gs.flatMap(g => (g === grpName ? gc : old.filter(d => (d.group || 'Geometrie') === g)));
    markDirty('Geometrie');
    switchTab('geometrie');
  } else if (type === 'info-field') {
    const [item] = state.infoDefs.splice(from, 1);
    state.infoDefs.splice(to, 0, item);
    markDirty('Info-Felder');
    switchTab('info');
  }
}

// ================================================================
// MODALS & INFO MANAGEMENT
// ================================================================

function showModal(id, html) {
  closeModal(id);
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.id = id + '_ov';
  ov.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(ov);
}

function closeModal(id) {
  const el = document.getElementById(id + '_ov');
  if (el) el.remove();
}

function openInfoFieldEdit(defId) {
  const def = state.infoDefs.find(d => d.id === defId);
  if (!def) return;
  if (def.type === 'radgroesse') return openInfoRadgroesse();
  if (def.type === 'gewicht') return openInfoGewicht();
  if (def.type === 'textarea') return openInfoText(def.id, def.label);
  if (def.type === 'richtext') return openInfoRichText(def.id, def.label);
  openInfoEdit(def.id, def.label, def.type || 'text');
}

function addInfoField() {
  showModal(
    'addinfo-modal',
    `
    <div class="modal-header"><div><div class="modal-title">Neues Feld</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('addinfo-modal')">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Feldname</label><input class="form-input" id="addinfo-name" placeholder="z.B. Seriennummer..." onkeydown="if(event.key==='Enter')confirmAddInfoField()"></div>
      <div class="form-group"><label class="form-label">Typ</label><select class="form-input" id="addinfo-type"><option value="text">Text</option><option value="number">Zahl</option><option value="date">Datum</option><option value="textarea">Mehrzeilig</option></select></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('addinfo-modal')">Abbrechen</button><button class="btn btn-primary" onclick="confirmAddInfoField()">Hinzufügen</button></div>`
  );
  setTimeout(() => document.getElementById('addinfo-name')?.focus(), 50);
}

function confirmAddInfoField() {
  const label = vv('addinfo-name').trim();
  if (!label) {
    showToast('Bitte Feldname eingeben');
    return;
  }
  const type = vv('addinfo-type');
  const id = 'info_' + uid();
  state.infoDefs.push({ id, label, type, isStandard: false });
  closeModal('addinfo-modal');
  markDirty('Info-Felder');
  switchTab('info');
}

function renameInfoField(defId, newLabel) {
  const def = state.infoDefs.find(d => d.id === defId);
  if (def && newLabel.trim()) def.label = newLabel.trim();
  markDirty('Info-Felder');
}

function deleteInfoField(defId) {
  const def = state.infoDefs.find(d => d.id === defId);
  if (!def || def.isStandard) return;
  if (!confirm(`Feld "${def.label}" löschen?`)) return;
  state.infoDefs = state.infoDefs.filter(d => d.id !== defId);
  state.bikes.forEach(b => {
    if (b.infoVals) delete b.infoVals[defId];
  });
  markDirty('Info-Felder');
  switchTab('info');
}

// ================================================================
// COMPONENT MODAL
// ================================================================

function openCompModal(fi) {
  const b = getBike(bikeId);
  const c = b.components[fi];
  if (!c) return;
  const h = cur(c.history);
  const todayEntry = c.history.find(e => e.datum === today());
  const fill = todayEntry || {};
  const naChecked = c.notVorhanden ? 'checked' : '';
  showModal(
    'comp-modal',
    `
    <div class="modal-header"><div><div class="modal-sub">${esc(c.group)}</div><div class="modal-title">${esc(c.name)}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('comp-modal')">✕</button></div>
    <div class="modal-body">
      <div class="checkbox-row" onclick="toggleNotVorhanden(${fi})">
        <input type="checkbox" id="nv-check" ${naChecked} onclick="event.stopPropagation();toggleNotVorhanden(${fi})">
        <label for="nv-check">Nicht vorhanden (z.B. kein Dämpfer beim Hardtail)</label>
      </div>
      ${
        c.notVorhanden
          ? `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Diese Komponente ist als «nicht vorhanden» markiert.</div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('comp-modal')">Schliessen</button></div>`
          : `<div class="cur-val-box"><div class="cur-val-label">Aktueller Stand</div><div class="cur-val-main ${!h ? 'empty' : ''}">${h ? esc(h.wert) : 'Noch nicht erfasst'}</div>${h ? `<div class="cur-val-meta">${h.gewicht ? `<span>⚖ ${esc(h.gewicht)} g</span>` : ''} ${h.preis ? `<span>💰 CHF ${esc(h.preis)}</span>` : ''} ${h.datum ? `<span>📅 ${fmtDate(h.datum)}</span>` : ''}</div>` : ''}</div>
      <hr class="div" style="margin-top:0">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:11px">Neuen Wert erfassen</div>
      <div class="form-group"><label class="form-label">Datum</label><input class="form-input" type="date" id="cd" value="${today()}" oninput="checkCompDate(${fi})" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('cw').focus()}"></div>
      <div class="form-group"><label class="form-label">Bezeichnung</label><textarea class="form-input" id="cw" rows="2" placeholder="z.B. Fox 38 Factory, 160mm...">${esc(fill.wert || (h ? h.wert : ''))}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label class="form-label">Gewicht (g)</label><input class="form-input" type="number" id="cg" placeholder="z.B. 2180" value="${esc(fill.gewicht || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('cp').focus()}"></div>
        <div class="form-group"><label class="form-label">Preis (CHF)</label><input class="form-input" type="number" id="cp" placeholder="z.B. 350" value="${esc(fill.preis || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('cn').focus()}"></div>
      </div>
      <div class="form-group"><label class="form-label">Notiz</label><input class="form-input" id="cn" placeholder="Optionale Bemerkung..." value="${esc(fill.notiz || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();saveComp(${fi})}"></div>
      ${histSection(c.history, false, `deleteCompHistory(${fi},__IDX__)`)}
      </div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('comp-modal')">Abbrechen</button><button id="comp-edit-btn" class="btn btn-warning btn-sm" style="display:${todayEntry ? '' : 'none'}" onclick="updateComp(${fi})">Bearbeiten</button><button class="btn btn-primary" onclick="saveComp(${fi})">Eintrag hinzufügen</button></div>`
      }
    `
  );
}

function toggleNotVorhanden(fi) {
  const b = getBike(bikeId);
  const c = b.components[fi];
  c.notVorhanden = !c.notVorhanden;
  markDirty(c.name);
  closeModal('comp-modal');
  openCompModal(fi);
  switchTab('komponenten');
}

function saveComp(fi) {
  const b = getBike(bikeId);
  const c = b.components[fi];
  if (!vv('cw').trim()) {
    showToast('Bitte Bezeichnung eingeben');
    return;
  }
  c.history.push({ datum: vv('cd'), wert: vv('cw'), gewicht: vv('cg'), preis: vv('cp'), notiz: vv('cn') });
  markDirty(c.name);
  closeModal('comp-modal');
  switchTab('komponenten');
}

function checkCompDate(fi) {
  const c = getBike(bikeId).components[fi];
  const entry = c.history.find(e => e.datum === vv('cd'));
  const btn = document.getElementById('comp-edit-btn');
  if (btn) btn.style.display = entry ? '' : 'none';
}

function updateComp(fi) {
  const b = getBike(bikeId);
  const c = b.components[fi];
  if (!vv('cw').trim()) { showToast('Bitte Bezeichnung eingeben'); return; }
  const entry = c.history.find(e => e.datum === vv('cd'));
  if (!entry) { showToast('Kein Eintrag für dieses Datum'); return; }
  entry.wert = vv('cw');
  entry.gewicht = vv('cg');
  entry.preis = vv('cp');
  entry.notiz = vv('cn');
  markDirty(c.name);
  closeModal('comp-modal');
  switchTab('komponenten');
}

function deleteCompHistory(fi, idx) {
  if (!confirm('Eintrag löschen?')) return;
  getBike(bikeId).components[fi].history.splice(idx, 1);
  markDirty('Komponente');
  closeModal('comp-modal');
  openCompModal(fi);
  switchTab('komponenten');
}

// ================================================================
// SETTING MODAL
// ================================================================

function openSetModal(si) {
  const b = getBike(bikeId);
  const s = b.settings[si];
  if (!s) return;
  const h = cur(s.history);
  const todayEntry = s.history.find(e => e.datum === today());
  const fill = todayEntry || {};
  const compRef = getCompRefHtml(b, s.label);
  showModal(
    'set-modal',
    `
    <div class="modal-header"><div><div class="modal-sub">${esc(s.group || 'Einstellung')}</div><div class="modal-title">${esc(s.label)}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('set-modal')">✕</button></div>
    <div class="modal-body">
      <div class="cur-val-box"><div class="cur-val-label">Aktueller Wert</div><div class="cur-val-main ${!h ? 'empty' : ''}" style="${h ? 'font-family:DM Mono,monospace;font-size:24px;font-weight:600' : ''}">${h ? esc(h.wert) + (s.unit ? ' ' + s.unit : '') : 'Noch nicht erfasst'}</div>${h ? `<div class="cur-val-meta">${h.datum ? `<span>📅 ${fmtDate(h.datum)}</span>` : ''} ${h.notiz ? `<span>📝 ${esc(h.notiz)}</span>` : ''}</div>` : ''}</div>
      ${compRef}
      <hr class="div" style="margin-top:0">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:11px">Neuen Wert erfassen</div>
      <div class="form-group"><label class="form-label">Datum</label><input class="form-input" type="date" id="sd" value="${today()}" oninput="checkSetDate(${si})" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('sw').focus()}"></div>
      <div class="form-group"><label class="form-label">Wert${s.unit ? ` (${esc(s.unit)})` : ''}</label><input class="form-input" id="sw" placeholder="Wert eingeben..." value="${esc(fill.wert || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('sn').focus()}"></div>
      <div class="form-group"><label class="form-label">Notiz</label><input class="form-input" id="sn" placeholder="Optionale Bemerkung..." value="${esc(fill.notiz || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();saveSetting(${si})}"></div>
      ${histSection(s.history, true, `deleteSetHistory(${si},__IDX__)`)}
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('set-modal')">Abbrechen</button><button id="set-edit-btn" class="btn btn-warning btn-sm" style="display:${todayEntry ? '' : 'none'}" onclick="updateSetting(${si})">Bearbeiten</button><button class="btn btn-primary" onclick="saveSetting(${si})">Speichern</button></div>`
  );
}

function saveSetting(si) {
  const b = getBike(bikeId);
  const s = b.settings[si];
  if (!vv('sw').trim()) {
    showToast('Bitte Wert eingeben');
    return;
  }
  const kompSnapshot = buildKompSnapshot(b, s.label);
  s.history.push({ datum: vv('sd'), wert: vv('sw'), notiz: vv('sn'), kompSnapshot });
  markDirty(s.label);
  closeModal('set-modal');
  switchTab('einstellungen');
}

function checkSetDate(si) {
  const s = getBike(bikeId).settings[si];
  const entry = s.history.find(e => e.datum === vv('sd'));
  const btn = document.getElementById('set-edit-btn');
  if (btn) btn.style.display = entry ? '' : 'none';
}

function updateSetting(si) {
  const b = getBike(bikeId);
  const s = b.settings[si];
  if (!vv('sw').trim()) { showToast('Bitte Wert eingeben'); return; }
  const entry = s.history.find(e => e.datum === vv('sd'));
  if (!entry) { showToast('Kein Eintrag für dieses Datum'); return; }
  entry.wert = vv('sw');
  entry.notiz = vv('sn');
  markDirty(s.label);
  closeModal('set-modal');
  switchTab('einstellungen');
}

function deleteSetHistory(si, idx) {
  if (!confirm('Eintrag löschen?')) return;
  getBike(bikeId).settings[si].history.splice(idx, 1);
  markDirty('Einstellung');
  closeModal('set-modal');
  openSetModal(si);
  switchTab('einstellungen');
}

// ================================================================
// GEOMETRY MODAL
// ================================================================

function openGeoModal(gi) {
  const b = getBike(bikeId);
  const geo = b.geometry[gi];
  if (!geo) return;
  const def = state.geoDefs.find(d => d.id === geo.defId);
  if (!def) return;
  const h = cur(geo.history);
  const todayEntry = geo.history.find(e => e.datum === today());
  const fill = todayEntry || {};
  showModal(
    'geo-modal',
    `
    <div class="modal-header"><div><div class="modal-sub">${esc(def.group || 'Geometrie')}</div><div class="modal-title">${esc(def.label)}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('geo-modal')">✕</button></div>
    <div class="modal-body">
      <div class="cur-val-box"><div class="cur-val-label">Aktueller Wert</div><div class="cur-val-main ${!h ? 'empty' : ''}" style="${h ? 'font-family:DM Mono,monospace;font-size:24px;font-weight:600' : ''}">${h ? esc(h.wert) + (def.unit ? ' ' + def.unit : '') : 'Noch nicht erfasst'}</div>${h ? `<div class="cur-val-meta">${h.datum ? `<span>📅 ${fmtDate(h.datum)}</span>` : ''} ${h.notiz ? `<span>📝 ${esc(h.notiz)}</span>` : ''}</div>` : ''}</div>
      <hr class="div" style="margin-top:0">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:11px">Neuen Wert erfassen</div>
      <div class="form-group"><label class="form-label">Datum</label><input class="form-input" type="date" id="gd" value="${today()}" oninput="checkGeoDate(${gi})" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('gw').focus()}"></div>
      <div class="form-group"><label class="form-label">Wert${def.unit ? ` (${esc(def.unit)})` : ''}</label><input class="form-input" id="gw" placeholder="Wert eingeben..." value="${esc(fill.wert || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('gn').focus()}"></div>
      <div class="form-group"><label class="form-label">Notiz</label><input class="form-input" id="gn" placeholder="z.B. Low Position, Flip-Chip..." value="${esc(fill.notiz || '')}" onkeydown="if(event.key==='Enter'){event.preventDefault();saveGeo(${gi})}"></div>
      ${histSection(geo.history, false, `deleteGeoHistory(${gi},__IDX__)`)}
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('geo-modal')">Abbrechen</button><button id="geo-edit-btn" class="btn btn-warning btn-sm" style="display:${todayEntry ? '' : 'none'}" onclick="updateGeo(${gi})">Bearbeiten</button><button class="btn btn-primary" onclick="saveGeo(${gi})">Speichern</button></div>`
  );
}

function saveGeo(gi) {
  const b = getBike(bikeId);
  const geo = b.geometry[gi];
  if (!vv('gw').trim()) {
    showToast('Bitte Wert eingeben');
    return;
  }
  geo.history.push({ datum: vv('gd'), wert: vv('gw'), notiz: vv('gn') });
  const def = state.geoDefs.find(d => d.id === geo.defId);
  markDirty(def ? def.label : 'Geometrie');
  closeModal('geo-modal');
  switchTab('geometrie');
}

function checkGeoDate(gi) {
  const geo = getBike(bikeId).geometry[gi];
  const entry = geo.history.find(e => e.datum === vv('gd'));
  const btn = document.getElementById('geo-edit-btn');
  if (btn) btn.style.display = entry ? '' : 'none';
}

function updateGeo(gi) {
  const b = getBike(bikeId);
  const geo = b.geometry[gi];
  if (!vv('gw').trim()) { showToast('Bitte Wert eingeben'); return; }
  const entry = geo.history.find(e => e.datum === vv('gd'));
  if (!entry) { showToast('Kein Eintrag für dieses Datum'); return; }
  entry.wert = vv('gw');
  entry.notiz = vv('gn');
  const def = state.geoDefs.find(d => d.id === geo.defId);
  markDirty(def ? def.label : 'Geometrie');
  closeModal('geo-modal');
  switchTab('geometrie');
}

function deleteGeoHistory(gi, idx) {
  if (!confirm('Eintrag löschen?')) return;
  getBike(bikeId).geometry[gi].history.splice(idx, 1);
  markDirty('Geometrie');
  closeModal('geo-modal');
  openGeoModal(gi);
  switchTab('geometrie');
}

// ================================================================
// TODO MODAL
// ================================================================

function openTodoModal(id, idx) {
  const b = getBike(id);
  const existing = idx >= 0 ? b.todos[idx] : null;
  showModal(
    'todo-modal',
    `
    <div class="modal-header"><div><div class="modal-title">${idx >= 0 ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('todo-modal')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="todo-bike-id" value="${id}">
      <input type="hidden" id="todo-edit-idx" value="${idx}">
      <div class="rich-toolbar"><button class="rich-btn" onclick="document.execCommand('bold')"><b>B</b></button><button class="rich-btn" onclick="document.execCommand('italic')"><i>I</i></button><button class="rich-btn" onclick="document.execCommand('underline')"><u>U</u></button><button class="rich-btn" onclick="document.execCommand('insertUnorderedList')">• Liste</button></div>
      <div id="todo-editor" contenteditable="true">${existing ? existing.text : ''}</div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('todo-modal')">Abbrechen</button><button class="btn btn-primary" onclick="saveTodoModal()">Speichern</button></div>`
  );
  setTimeout(() => {
    const ed = document.getElementById('todo-editor');
    if (ed) {
      ed.focus();
      const r = document.createRange();
      r.selectNodeContents(ed);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
  }, 50);
}

function saveTodoModal() {
  const id = vv('todo-bike-id');
  const idx = parseInt(vv('todo-edit-idx'));
  const html = (document.getElementById('todo-editor')?.innerHTML || '').trim();
  if (!html || html === '<br>') return showToast('Bitte Text eingeben');
  const b = getBike(id);
  if (idx < 0) {
    b.todos.push({ text: html, done: false });
  } else {
    b.todos[idx].text = html;
  }
  markDirty('ToDo');
  closeModal('todo-modal');
  switchTab('todos');
}

function toggleTodo(id, i) {
  getBike(id).todos[i].done = !getBike(id).todos[i].done;
  markDirty('ToDo');
  switchTab('todos');
}

function delTodo(id, i) {
  getBike(id).todos.splice(i, 1);
  markDirty('ToDo');
  switchTab('todos');
}

// ================================================================
// HISTORY & HELPER FUNCTIONS
// ================================================================

function makeHistHtml(entries, isSettings, delFn) {
  return [...entries]
    .reverse()
    .map((h, ri) => {
      const origIdx = entries.length - 1 - ri;
      const snap = isSettings && h.kompSnapshot && Object.keys(h.kompSnapshot).length ? h.kompSnapshot : null;
      const snapHtml = snap
        ? Object.entries(snap)
            .map(([k, v]) => `<div class="hist-kompsnap"><div class="hist-kompsnap-label">${esc(k)}</div>${esc(v) || '—'}</div>`)
            .join('')
        : '';
      const delBtn = delFn
        ? `<button class="btn btn-ghost btn-sm" onclick="${delFn.replace('__IDX__', origIdx)}" style="padding:2px 5px;color:var(--muted);flex-shrink:0" title="Eintrag löschen">✕</button>`
        : '';
      return `<div class="hist-entry ${ri === 0 ? 'current' : ''}">
      <div style="display:flex;align-items:flex-start;gap:4px">
        <div style="flex:1">
          <div class="hist-date">${fmtDate(h.datum) || 'Kein Datum'}</div>
          <div class="hist-val">${esc(h.wert || '—')}</div>
          <div class="hist-meta">${h.gewicht ? `<span>⚖ ${esc(h.gewicht)} g</span>` : ''} ${h.preis ? `<span>💰 CHF ${esc(h.preis)}</span>` : ''} ${h.notiz ? `<span>📝 ${esc(h.notiz)}</span>` : ''}</div>
          ${snapHtml}
        </div>
        ${delBtn}
      </div>
    </div>`;
    })
    .join('');
}

function histSection(entries, isSettings, delFn) {
  if (!entries || !entries.length) return '';
  const uid2 = 'h' + Math.random().toString(36).slice(2);
  return `<div class="hist-toggle" onclick="const c=document.getElementById('${uid2}');const o=c.style.display!=='none';c.style.display=o?'none':'block';this.querySelector('.hist-icon').style.transform=o?'rotate(0)':'rotate(90deg)'">
    <span class="hist-icon">▶</span>Historie (${entries.length} ${entries.length === 1 ? 'Eintrag' : 'Einträge'})</div>
  <div id="${uid2}" style="display:none;padding-top:8px">${makeHistHtml(entries, isSettings, delFn)}</div>`;
}

function getCompRefHtml(b, settingLabel) {
  const compNames = SETTING_COMP_MAP[settingLabel];
  if (!compNames || !compNames.length) return '';
  return compNames
    .map(cn => {
      const comp = b.components.find(c => c.name === cn);
      if (!comp) return '';
      const h = cur(comp.history);
      const isNA = comp.notVorhanden;
      return `<div class="comp-ref-box">
      <div class="comp-ref-label">${esc(cn)}</div>
      <div class="comp-ref-val ${!h && !isNA ? 'empty-ref' : ''}">${isNA ? 'Nicht vorhanden' : h ? esc(h.wert) : 'Noch nicht erfasst'}</div>
      ${h && h.datum && !isNA ? `<div style="font-size:11px;margin-top:4px;color:var(--muted)">📅 ${fmtDate(h.datum)}</div>` : ''}
    </div>`;
    })
    .join('');
}

function buildKompSnapshot(b, settingLabel) {
  const compNames = SETTING_COMP_MAP[settingLabel];
  if (!compNames) return {};
  const snap = {};
  compNames.forEach(cn => {
    const comp = b.components.find(c => c.name === cn);
    if (!comp || comp.notVorhanden) return;
    const h = cur(comp.history);
    if (h) snap[cn] = h.wert;
  });
  return snap;
}

// ================================================================
// PERSONAL & LIGHTBOX
// ================================================================

function savePersonal() {
  const ed = document.getElementById('personal-editor');
  if (ed) {
    state.personalInfo = ed.innerHTML;
    saveState(true);
  }
}

function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.style.display = 'flex';
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
}

function goToSnap(bId, date) {
  _snapTarget = date;
  navigate('bike', bId, 'komponenten');
}

// ================================================================
// PHOTOS
// ================================================================

function processPhotoFiles(files) {
  if (!files.length || !bikeId) return;
  const b = getBike(bikeId);
  let pending = files.length;
  let exifFound = false;
  files.forEach(file => {
    const r = new FileReader();
    r.onload = ev => {
      const buf = ev.target.result;
      const exifDate = readExifDate(buf);
      if (exifDate) exifFound = true;
      const lmDate = new Date(file.lastModified).toISOString().slice(0, 10);
      const datum = exifDate || lmDate;
      const blob = new Blob([buf], { type: file.type || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width,
          h = img.height,
          max = 1200;
        if (w > max) {
          h = (h * (max / w)) | 0;
          w = max;
        }
        if (h > max) {
          w = (w * (max / h)) | 0;
          h = max;
        }
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        b.fotos.push({ data: c.toDataURL('image/jpeg', 0.72), datum });
        URL.revokeObjectURL(url);
        pending--;
        if (pending === 0) {
          markDirty('Fotos');
          if (tab === 'info') switchTab('info');
          if (tab === 'zeitstrahl') switchTab('zeitstrahl');
          showToast(
            `${files.length} Foto${files.length > 1 ? 's' : ''} hinzugefügt${exifFound ? ' (Datum aus EXIF)' : ' (Datum aus Datei)'}`
          );
        }
      };
      img.onerror = () => {
        pending--;
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
    r.readAsArrayBuffer(file);
  });
}

function handlePhotos(e) {
  processPhotoFiles(Array.from(e.target.files));
  e.target.value = '';
}

function dropPhotos(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  processPhotoFiles(files);
}

function delPhoto(i) {
  getBike(bikeId).fotos.splice(i, 1);
  markDirty('Fotos');
  if (tab === 'zeitstrahl') switchTab('zeitstrahl');
  else switchTab('info');
}

function editPhotoDate(i) {
  const b = getBike(bikeId);
  const f = b.fotos[i];
  const cur = typeof f === 'string' ? today() : f.datum || today();
  showModal(
    'epd-modal',
    `
    <div class="modal-header"><div><div class="modal-title">Foto-Datum</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('epd-modal')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="epd-idx" value="${i}">
      <div class="form-group"><label class="form-label">Aufnahmedatum</label><input class="form-input" type="date" id="epd-date" value="${cur}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('epd-modal')">Abbrechen</button>
      <button class="btn btn-primary" onclick="savePhotoDate()">Speichern</button>
    </div>`
  );
}

function savePhotoDate() {
  const i = parseInt(vv('epd-idx'));
  const datum = vv('epd-date');
  if (!datum) return;
  const b = getBike(bikeId);
  const f = b.fotos[i];
  if (typeof f === 'string') b.fotos[i] = { data: f, datum };
  else f.datum = datum;
  markDirty('Fotos');
  closeModal('epd-modal');
  switchTab('info');
}

// ================================================================
// INFO FIELD EDITING
// ================================================================

let _infoEditField = '';

function _infoReadVal(b, field) {
  const def = state.infoDefs?.find(d => d.id === field);
  return def && !def.isStandard ? ((b.infoVals || {})[field] || '') : b[field] || '';
}

function infoFieldSuggestions(field) {
  const def = state.infoDefs?.find(d => d.id === field);
  const vals = new Set();
  state.bikes.forEach(b => {
    const v = def && !def.isStandard ? ((b.infoVals || {})[field] || '') : b[field] || '';
    if (v) vals.add(v);
  });
  return [...vals].sort((a, b) => a.localeCompare(b, 'de'));
}

function openInfoEdit(field, label, type) {
  _infoEditField = field;
  const b = getBike(bikeId);
  const val = _infoReadVal(b, field);
  const sugg = type === 'text' ? infoFieldSuggestions(field) : [];
  const dl = sugg.length ? `<datalist id="info-dl">${sugg.map(s => `<option value="${esc(s)}">`).join('')}</datalist>` : '';
  const listAttr = sugg.length ? ' list="info-dl"' : '';
  showModal(
    'info-modal',
    `
    <div class="modal-header"><div><div class="modal-title">${esc(label)}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('info-modal')">✕</button></div>
    <div class="modal-body"><div class="form-group"><label class="form-label">${esc(label)}</label>${dl}<input class="form-input" id="info-inp" type="${type || 'text'}"${listAttr} value="${esc(val)}" onkeydown="if(event.key==='Enter')saveInfoField()"></div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('info-modal')">Abbrechen</button><button class="btn btn-primary" onclick="saveInfoField()">Speichern</button></div>`
  );
  setTimeout(() => {
    const el = document.getElementById('info-inp');
    if (el) {
      el.focus();
      el.select();
    }
  }, 50);
}

function openInfoText(field, label) {
  _infoEditField = field;
  const b = getBike(bikeId);
  const val = _infoReadVal(b, field);
  showModal(
    'info-modal',
    `
    <div class="modal-header"><div><div class="modal-title">${esc(label)}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('info-modal')">✕</button></div>
    <div class="modal-body"><div class="form-group"><textarea class="form-input" id="info-inp" rows="4">${esc(val)}</textarea></div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('info-modal')">Abbrechen</button><button class="btn btn-primary" onclick="saveInfoField()">Speichern</button></div>`
  );
  setTimeout(() => document.getElementById('info-inp')?.focus(), 50);
}

function openInfoRichText(field, label) {
  _infoEditField = field;
  const b = getBike(bikeId);
  const val = _infoReadVal(b, field);
  showModal(
    'info-modal',
    `<div class="modal-header"><div><div class="modal-title">${esc(label)}</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('info-modal')">✕</button></div>
    <div class="modal-body">
      <div class="rich-toolbar"><button class="rich-btn" onclick="document.execCommand('bold')"><b>B</b></button><button class="rich-btn" onclick="document.execCommand('italic')"><i>I</i></button><button class="rich-btn" onclick="document.execCommand('underline')"><u>U</u></button><button class="rich-btn" onclick="document.execCommand('insertUnorderedList')">• Liste</button></div>
      <div id="info-richtext-editor" contenteditable="true">${val || ''}</div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('info-modal')">Abbrechen</button><button class="btn btn-primary" onclick="saveInfoRichText()">Speichern</button></div>`
  );
  setTimeout(() => {
    const ed = document.getElementById('info-richtext-editor');
    if (ed) {
      ed.focus();
      const r = document.createRange();
      r.selectNodeContents(ed);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
  }, 50);
}

function saveInfoRichText() {
  const b = getBike(bikeId);
  const def = state.infoDefs?.find(d => d.id === _infoEditField);
  const html = (document.getElementById('info-richtext-editor')?.innerHTML || '').trim();
  if (def && !def.isStandard) {
    if (!b.infoVals) b.infoVals = {};
    b.infoVals[def.id] = html;
  } else {
    b[_infoEditField] = html;
  }
  markDirty(_infoEditField);
  closeModal('info-modal');
  switchTab('info');
}

function saveInfoField() {
  const b = getBike(bikeId);
  const def = state.infoDefs?.find(d => d.id === _infoEditField);
  const val = vv('info-inp');
  if (def && !def.isStandard) {
    if (!b.infoVals) b.infoVals = {};
    b.infoVals[def.id] = val;
  } else {
    b[_infoEditField] = val;
  }
  markDirty(_infoEditField);
  closeModal('info-modal');
  switchTab('info');
}

function openInfoRadgroesse() {
  const b = getBike(bikeId);
  showModal(
    'info-modal',
    `
    <div class="modal-header"><div><div class="modal-title">Radgrösse</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('info-modal')">✕</button></div>
    <div class="modal-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="form-label">Vorne</label><input class="form-input" id="info-rv" maxlength="5" value="${esc(b.radgroesseV || '')}" placeholder='29"' onkeydown="if(event.key==='Enter')saveInfoRadgroesse()"></div>
      <div class="form-group"><label class="form-label">Hinten</label><input class="form-input" id="info-rh" maxlength="5" value="${esc(b.radgroesseH || '')}" placeholder='29"' onkeydown="if(event.key==='Enter')saveInfoRadgroesse()"></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('info-modal')">Abbrechen</button><button class="btn btn-primary" onclick="saveInfoRadgroesse()">Speichern</button></div>`
  );
  setTimeout(() => document.getElementById('info-rv')?.focus(), 50);
}

function saveInfoRadgroesse() {
  const b = getBike(bikeId);
  b.radgroesseV = vv('info-rv');
  b.radgroesseH = vv('info-rh');
  markDirty('Radgrösse');
  closeModal('info-modal');
  switchTab('info');
}

function openInfoGewicht() {
  const b = getBike(bikeId);
  const totalCompG = b.components
    .filter(c => !c.notVorhanden)
    .map(c => parseFloat((cur(c.history) || {}).gewicht))
    .filter(v => !isNaN(v))
    .reduce((a, x) => a + x, 0);
  showModal(
    'info-modal',
    `
    <div class="modal-header"><div><div class="modal-title">Gewicht</div></div><button class="btn btn-ghost btn-sm" onclick="closeModal('info-modal')">✕</button></div>
    <div class="modal-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="form-label">Gewogen (g)</label><input class="form-input" id="info-gw" type="number" value="${esc(b.gewichtGewogen || '')}" placeholder="—" onkeydown="if(event.key==='Enter')saveInfoGewicht()"></div>
      <div class="form-group"><label class="form-label">Berechnet (g)</label><input class="form-input" readonly tabindex="-1" value="${totalCompG > 0 ? totalCompG : ''}" placeholder="—" style="color:var(--muted);cursor:default"></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('info-modal')">Abbrechen</button><button class="btn btn-primary" onclick="saveInfoGewicht()">Speichern</button></div>`
  );
  setTimeout(() => document.getElementById('info-gw')?.focus(), 50);
}

function saveInfoGewicht() {
  const b = getBike(bikeId);
  b.gewichtGewogen = vv('info-gw');
  markDirty('Gewicht');
  closeModal('info-modal');
  switchTab('info');
}

// ================================================================
// IMPORT / EXPORT / UTILS
// ================================================================

function unloadJson() {
  if (!confirm('Alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
  state = { version: 12, personalInfo: '', bikes: [], geoDefs: defaultGeoDefs(), infoDefs: DEFAULT_INFO_DEFS.map(d => ({ ...d })) };
  localStorage.setItem(KEY, JSON.stringify(state));
  hideBanner();
  buildBikeLinks();
  navigate('overview');
  showToast('Daten gelöscht');
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const filename = `velodb_${new Date().toISOString().split('T')[0]}.json`;
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'application/json' })] })) {
    navigator.share({ files: [new File([blob], filename, { type: 'application/json' })], title: 'VeloDB Backup' }).catch(() => {});
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
}

function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (!confirm('Alle Daten werden überschrieben?')) return;
      state = d;
      // apply same migrations as initial load
      ensureGeoDefs();
      if (!state.infoDefs) state.infoDefs = DEFAULT_INFO_DEFS.map(def => ({ ...def }));
      state.bikes.forEach(b => {
        b.components.forEach(c => { if (c.notVorhanden === undefined) c.notVorhanden = false; });
        b.fotos = (b.fotos || []).map(f => typeof f === 'string' ? { data: f, datum: today() } : f);
        if (b.aktuelleProbleme !== undefined && b.aktuellerZustand === undefined) { b.aktuellerZustand = b.aktuelleProbleme; delete b.aktuelleProbleme; }
        if (!b.geometry) b.geometry = [];
        if (b.variante === undefined) b.variante = '';
        if (b.bezugsdatum === undefined) b.bezugsdatum = '';
        if (b.listenpreis === undefined) b.listenpreis = '';
        if (b.radgroesseV === undefined) b.radgroesseV = '';
        if (b.radgroesseH === undefined) b.radgroesseH = '';
        if (!b.infoVals) b.infoVals = {};
        if (!b.todos) b.todos = [];
        ensureBikeGeo(b);
      });
      saveState(false);
      buildBikeLinks();
      navigate('overview');
      showToast('Import ✓');
    } catch {
      alert('Ungültige JSON-Datei.');
    }
  };
  r.readAsText(file);
  e.target.value = '';
}

function exportCsv(id) {
  const b = getBike(id);
  const rows = [['Gruppe', 'Komponente', 'Datum', 'Bezeichnung', 'Gewicht (g)', 'Preis (CHF)', 'Notiz']];
  b.components.forEach(c => {
    if (!c.notVorhanden) c.history.forEach(h => rows.push([c.group, c.name, h.datum, h.wert, h.gewicht, h.preis, h.notiz]));
  });
  const csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${b.marke}_${b.modell}.csv`.replace(/[\s\/]+/g, '_');
  a.click();
}

function attachListeners() {
  document.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', () => {
      const b = getBike(bikeId);
      if (!b) return;
      b[el.dataset.field] = el.value;
      markDirty(el.dataset.label || el.dataset.field);
    });
  });
}
