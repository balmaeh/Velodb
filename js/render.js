// ================================================================
// RENDER
// ================================================================

function render() {
  clearSlideshows();
  const el = document.getElementById('view');
  if (view === 'overview') el.innerHTML = renderOverview();
  else if (view === 'bike') el.innerHTML = renderDetail();
  else if (view === 'compare') el.innerHTML = renderCompare();
  else if (view === 'personal') el.innerHTML = renderPersonal();
  else if (view === 'gallery') el.innerHTML = renderGallery();
  attachListeners();
  initSlideshows();
  if (_snapTarget && view === 'bike' && tab === 'komponenten') {
    const zt = document.getElementById('zt-main');
    const hdr = zt && zt.previousElementSibling;
    if (zt) {
      zt.style.display = 'block';
      if (hdr) hdr.querySelector('.collapse-icon')?.classList.add('open');
    }
    const target = document.getElementById('snap-' + _snapTarget);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    _snapTarget = null;
  }
}

function renderOverview() {
  const bikes = state.bikes.filter(b => (filter === 'alle' ? true : b.status === filter));
  return `<div class="topbar"><div class="topbar-title">Meine Bikes</div><div class="topbar-actions"><button class="btn btn-primary btn-sm" onclick="addBike()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Neues Bike</button></div></div>
  <div class="content">
    <div class="filter-bar"><div class="filter-tabs"><div class="filter-tab ${filter === 'aktiv' ? 'active' : ''}" onclick="setFilter('aktiv')">Aktiv</div><div class="filter-tab ${filter === 'ausgemustert' ? 'active' : ''}" onclick="setFilter('ausgemustert')">Ausgemustert</div><div class="filter-tab ${filter === 'alle' ? 'active' : ''}" onclick="setFilter('alle')">Alle (${state.bikes.length})</div></div></div>
    ${bikes.length === 0 ? `<div class="empty-state"><h3>Keine Bikes</h3><p>Füge ein neues Bike hinzu oder ändere den Filter.</p></div>` : `<div class="bikes-grid">${bikes.map(bikeCard).join('')}</div>`}
  </div>`;
}

function bikeCard(b) {
  const p = lastPhoto(b);
  const w = b.gewichtGewogen ? (parseInt(b.gewichtGewogen) / 1000).toFixed(2) + ' kg' : null;
  return `<div class="bike-card" onclick="navigate('bike','${b.id}')">
    <div class="bike-card-photo">${
      p
        ? `<img src="${p}" alt="">`
        : `<div class="no-photo"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>Kein Foto</div>`
    }<div class="bike-status-badge status-${b.status}">${b.status}</div></div>
    <div class="bike-card-body"><div class="bike-card-brand">${esc(b.marke)}</div><div class="bike-card-model">${esc(b.modell) || 'Unbenannt'}</div>
    <div class="bike-meta-row"><span class="bike-meta-chip">${b.typ ? '🏔 ' + esc(b.typ) : ''}</span> <span class="bike-meta-chip">${b.jahr ? '📅 ' + esc(b.jahr) : ''}</span> <span class="bike-meta-chip">${b.federweg ? '↕ ' + esc(b.federweg) : ''}</span> <span class="bike-meta-chip">${w ? '⚖ ' + w : ''}</span></div></div>
  </div>`;
}

function renderDetail() {
  const b = getBike(bikeId);
  if (!b) return '<div class="content">Nicht gefunden.</div>';
  const p = lastPhoto(b);
  const todosOpen = b.todos.filter(t => !t.done).length;
  const TABS = [
    { id: 'info', l: 'Info' },
    { id: 'komponenten', l: 'Komponenten' },
    { id: 'einstellungen', l: 'Einstellungen' },
    { id: 'geometrie', l: 'Geometrie' },
    { id: 'todos', l: `ToDo${todosOpen ? ` (${todosOpen})` : ''}` },
  ];
  return `<div class="topbar">
    <div style="display:flex;align-items:center;gap:13px"><div class="back-btn" onclick="navigate('overview')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>Zurück</div><div class="topbar-title">${esc(b.marke)} ${esc(b.modell)}</div></div>
    <div class="topbar-actions"><button class="btn btn-secondary btn-sm" onclick="retireBike('${b.id}')">${b.status === 'aktiv' ? 'Ausmustern' : 'Reaktivieren'}</button><button class="btn btn-danger btn-sm" onclick="deleteBike('${b.id}')">Löschen</button><button class="btn btn-primary btn-sm" onclick="doSave()">Speichern</button></div>
  </div>
  <div class="bike-hero">
    <div class="hero-photo" onclick="document.getElementById('file-photo').click()" title="Foto hinzufügen">${
      p
        ? `<img src="${p}" alt="">`
        : `<span style="text-align:center;padding:5px;font-size:11px">+ Foto</span>`
    }</div>
    <div class="hero-info"><div class="hero-brand">${esc(b.marke)}</div><div class="hero-model">${esc(b.modell) || 'Unbenannt'}</div>
    <div class="hero-chips">${b.typ ? `<div class="hero-chip">🏔 ${esc(b.typ)}</div>` : ''} ${b.groesse ? `<div class="hero-chip">📐 ${esc(b.groesse)}</div>` : ''} ${b.federweg ? `<div class="hero-chip">↕ ${esc(b.federweg)} mm</div>` : ''} ${b.gewichtGewogen ? `<div class="hero-chip">⚖ ${(parseInt(b.gewichtGewogen) / 1000).toFixed(2)} kg</div>` : ''} ${b.preis ? `<div class="hero-chip">💰 CHF ${esc(b.preis)}</div>` : ''} <div class="hero-chip" style="background:${b.status === 'aktiv' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.1)'};color:${b.status === 'aktiv' ? '#22c55e' : '#ef4444'}">${b.status}</div></div></div>
  </div>
  <div class="detail-tabs">${TABS.map(t => `<div class="detail-tab ${tab === t.id ? 'active' : ''}" onclick="switchTab('${t.id}')">${t.l}</div>`).join('')}</div>
  <div class="content" id="tab-content">${renderTab(b)}</div>`;
}

function switchTab(t) {
  clearSlideshows();
  tab = t;
  const b = getBike(bikeId);
  document.querySelectorAll('.detail-tab').forEach((el, i) => el.classList.toggle('active', ['info', 'komponenten', 'einstellungen', 'geometrie', 'todos'][i] === t));
  const tc = document.getElementById('tab-content');
  if (tc) {
    tc.innerHTML = renderTab(b);
    attachListeners();
  }
  initSlideshows();
}

function renderTab(b) {
  if (tab === 'info') return tabInfo(b);
  if (tab === 'komponenten') return tabKomponenten(b);
  if (tab === 'einstellungen') return tabEinstellungen(b);
  if (tab === 'geometrie') return tabGeometrie(b);
  if (tab === 'todos') return tabTodos(b);
  return tabInfo(b);
}

const _SEP = '<span style="color:var(--border);margin:0 8px">/</span>';

function getInfoVal(b, def) {
  const totalCompG = b.components
    .filter(c => !c.notVorhanden)
    .map(c => parseFloat((cur(c.history) || {}).gewicht))
    .filter(v => !isNaN(v))
    .reduce((a, x) => a + x, 0);
  if (def.type === 'radgroesse')
    return b.radgroesseV || b.radgroesseH ? `${esc(b.radgroesseV || '—')}${_SEP}${esc(b.radgroesseH || '—')}` : '';
  if (def.type === 'gewicht') {
    const g = b.gewichtGewogen ? b.gewichtGewogen + 'g' : '';
    const bc = totalCompG > 0 ? totalCompG + 'g' : '';
    return g || bc ? `${esc(g || '—')}${_SEP}${esc(bc || '—')}` : '';
  }
  if (def.isStandard) return def.id === 'bezugsdatum' && b[def.id] ? fmtDate(b[def.id]) : b[def.id] || '';
  return (b.infoVals || {})[def.id] || '';
}

function editBtn(tabId) {
  return `<button class="edit-btn ${editMode === tabId ? 'active' : ''}" onclick="toggleEditMode('${tabId}')" title="Felder bearbeiten"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>${editMode === tabId ? ' Fertig' : ' Felder'}</button>`;
}

function tabInfo(b) {
  const em = editMode === 'info';
  dndInfoFields = state.infoDefs;
  window._bikeSrcs = (b.fotos || []).map(f => (typeof f === 'string' ? f : f.data));
  const fotosHtml =
    b.fotos && b.fotos.length
      ? `<div class="photo-grid">${b.fotos
          .map((f, i) => {
            const src = window._bikeSrcs[i];
            return `<div class="photo-thumb"><img src="${src}" style="cursor:zoom-in" onclick="openLightbox(window._bikeSrcs[${i}])"><div class="photo-date-badge" onclick="editPhotoDate(${i})" title="Datum bearbeiten">${(typeof f === 'string' ? '' : f.datum) || '–'} ✎</div><div class="photo-del" onclick="delPhoto(${i})">✕</div></div>`;
          })
          .join('')}</div>`
      : `<div class="photo-upload-area" onclick="document.getElementById('file-photo').click()">Fotos ablegen oder klicken</div>`;
  const fieldsHtml = em
    ? state.infoDefs
        .map(
          (def, di) => `<div class="field-edit-row" data-dnd-type="info-field" data-dnd-idx="${di}">
        <div class="drag-handle" data-dnd-type="info-field" data-dnd-idx="${di}" onpointerdown="startDrag(event,'info-field',${di},0)">${HSVG}</div>
        <input class="field-edit-input" value="${esc(def.label)}" onblur="renameInfoField('${def.id}',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
        ${def.isStandard ? `<span style="font-size:10px;color:var(--muted);padding:0 4px;white-space:nowrap">Standard</span>` : `<button class="btn btn-danger btn-sm" onclick="deleteInfoField('${def.id}')">✕</button>`}
      </div>`
        )
        .join('')
    : state.infoDefs
        .map(def => {
          const v = getInfoVal(b, def);
          const html = def.type === 'radgroesse' || def.type === 'gewicht' || def.type === 'richtext';
          return `<div class="info-field-row" onclick="openInfoFieldEdit('${def.id}')">
        <div class="info-lbl">${esc(def.label)}</div>
        <div class="info-val${v ? '' : ' empty'}">${v ? (html ? v : esc(v)) : '—'}</div>
      </div>`;
        })
        .join('');
  return `<div class="section"><div class="section-header"><div class="section-title">Allgemeine Infos</div>${editBtn('info')}</div>
    ${em ? `<div class="edit-mode-bar">✏ Verschieben, umbenennen oder löschen. Standard-Felder können nicht gelöscht werden.</div>` : ''}
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden">${fieldsHtml}</div>
    ${em ? `<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="addInfoField()">+ Neues Feld</button></div>` : ''}
  </div>
  <div class="section"><div class="section-header"><div class="section-title">Fotos</div><button class="btn btn-secondary btn-sm" onclick="document.getElementById('file-photo').click()">+ Foto</button></div>
    <div class="photo-drop-zone" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:13px" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="if(!event.relatedTarget||!this.contains(event.relatedTarget))this.classList.remove('drag-over')" ondrop="dropPhotos(event)">
      ${fotosHtml}
      <div style="margin-top:11px"><button class="btn btn-secondary btn-sm" onclick="exportCsv('${b.id}')">📄 CSV Export</button></div>
    </div>
  </div>`;
}

function tabKomponenten(b) {
  ensureBikeGeo(b);
  const groups = {};
  b.components.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });
  const gNames = compGroupOrder(b.components);
  dndCompGrpNames = gNames;
  const totalG = b.components
    .filter(c => !c.notVorhanden)
    .map(c => parseFloat((cur(c.history) || {}).gewicht))
    .filter(v => !isNaN(v))
    .reduce((a, x) => a + x, 0);
  const em = editMode === 'komponenten';

  const groupsHtml = gNames
    .map((g, gi) => {
      const comps = groups[g] || [];
      if (em) {
        return `<div class="group-card" data-dnd-type="comp-group" data-dnd-idx="${gi}" style="margin-bottom:9px">
        <div class="group-title-row"><div class="drag-handle" data-dnd-type="comp-group" data-dnd-idx="${gi}" onpointerdown="startDrag(event,'comp-group',${gi},${gi})">${HSVG}</div><div class="group-title-text">${esc(g)}</div></div>
        ${comps
          .map((c, ci) => {
            const fi = b.components.indexOf(c);
            return `<div class="field-edit-row" data-dnd-type="comp" data-dnd-idx="${ci}">
          <div class="drag-handle" data-dnd-type="comp" data-dnd-idx="${ci}" onpointerdown="startDrag(event,'comp',${ci},${gi});event.stopPropagation()">${HSVG}</div>
          <input class="field-edit-input" value="${esc(c.name)}" onblur="renameCompField('${c.name.replace(/'/g, "\\'")}',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
          <button class="btn btn-danger btn-sm" onclick="deleteCompField('${c.name.replace(/'/g, "\\'")}')"  >✕</button>
        </div>`;
          })
          .join('')}
        <div style="padding:8px 12px"><button class="btn btn-secondary btn-sm" onclick="addCompField('${g.replace(/'/g, "\\'")}')" >+ Feld</button></div>
      </div>`;
      }
      return `<div class="group-card">
      <div class="group-title-row"><div class="group-title-text">${esc(g)}</div></div>
      ${comps
        .map((c, ci) => {
          const h = cur(c.history);
          const fi = b.components.indexOf(c);
          return `<div class="comp-row${c.notVorhanden ? ' not-available' : ''}" onclick="openCompModal(${fi})">
          <div class="comp-name">${esc(c.name)}</div>
          <div class="comp-val ${c.notVorhanden ? 'na' : !h ? 'empty' : ''}">${c.notVorhanden ? 'Nicht vorhanden' : h ? esc(h.wert) : 'Nicht erfasst'}</div>
          <div class="comp-num">${!c.notVorhanden && h && h.gewicht ? h.gewicht + 'g' : ''}</div>
          <div class="comp-num">${!c.notVorhanden && h && h.preis ? 'CHF ' + h.preis : ''}</div>
          ${c.notVorhanden ? `<div class="na-badge">n/v</div>` : c.history.length > 1 ? `<div class="hist-badge">${c.history.length}×</div>` : '<div></div>'}
        </div>`;
        })
        .join('')}
    </div>`;
    })
    .join('');

  // Collapsible Zeitstrahl
  const ztId = 'zt-main';
  const ztHtml = buildZeitstrahlHtml(b);

  return `<div class="section">
    <div class="section-header">
      <div class="section-title">Komponenten</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-family:'DM Mono',monospace;font-size:11.5px;color:var(--muted)">Gesamt: <strong style="color:var(--text)">${totalG > 0 ? (totalG / 1000).toFixed(3) + ' kg' : '—'}</strong></span>
        ${editBtn('komponenten')}
      </div>
    </div>
    ${em ? `<div class="edit-mode-bar">✏ Felder umbenennen oder löschen. Drag & Drop zum Sortieren. Änderungen gelten für alle Bikes.</div>` : ''}
    ${groupsHtml}
    <div class="collapse-header" onclick="const c=document.getElementById('${ztId}');const o=c.style.display!=='none';c.style.display=o?'none':'block';this.querySelector('.collapse-icon').classList.toggle('open',!o)">
      <span class="collapse-icon">▶</span>Zeitstrahl
    </div>
    <div id="${ztId}" style="display:none">${ztHtml}</div>
  </div>`;
}

function tabEinstellungen(b) {
  const groups = {};
  b.settings.forEach(s => {
    const g = s.group || 'Sonstige';
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  });
  const gNames = setGroupOrder(b.settings);
  dndSetGrpNames = gNames;
  const em = editMode === 'einstellungen';

  const groupsHtml = gNames
    .map((g, gi) => {
      const settings = groups[g] || [];
      if (em) {
        return `<div class="group-card" data-dnd-type="setting-group" data-dnd-idx="${gi}" style="margin-bottom:9px">
        <div class="group-title-row"><div class="drag-handle" data-dnd-type="setting-group" data-dnd-idx="${gi}" onpointerdown="startDrag(event,'setting-group',${gi},${gi})">${HSVG}</div><div class="group-title-text">${esc(g)}</div></div>
        ${settings
          .map((s, si) => {
            return `<div class="field-edit-row" data-dnd-type="setting" data-dnd-idx="${si}">
          <div class="drag-handle" data-dnd-type="setting" data-dnd-idx="${si}" onpointerdown="startDrag(event,'setting',${si},${gi});event.stopPropagation()">${HSVG}</div>
          <input class="field-edit-input" value="${esc(s.label)}" id="se_${b.settings.indexOf(s)}" onblur="renameSetField('${s.label.replace(/'/g, "\\'")}',this.value)" onkeydown="if(event.key==='Enter')this.blur()">
          <input class="field-edit-unit" value="${esc(s.unit || '')}" placeholder="Einheit" onblur="const si=${b.settings.indexOf(s)};getBike(bikeId).settings[si].unit=this.value;markDirty('Felder')">
          <button class="btn btn-danger btn-sm" onclick="deleteSetField('${s.label.replace(/'/g, "\\'")}')" >✕</button>
        </div>`;
          })
          .join('')}
        <div style="padding:8px 12px"><button class="btn btn-secondary btn-sm" onclick="addSetField()" >+ Feld</button></div>
      </div>`;
      }
      return `<div class="group-card">
      <div class="group-title-row"><div class="group-title-text">${esc(g)}</div></div>
      ${settings
        .map((s, si) => {
          const gi2 = b.settings.indexOf(s);
          const h = cur(s.history);
          return `<div class="setting-row">
          <div class="setting-label">${esc(s.label)}${s.unit ? ` <span style="font-size:9.5px;font-weight:400">(${esc(s.unit)})</span>` : ''}</div>
          <div class="setting-val ${!h ? 'empty' : ''}" onclick="openSetModal(${gi2})">${h ? esc(h.wert) + (s.unit ? ' ' + s.unit : '') : '— klicken'}</div>
          <div class="setting-actions">${s.history.length > 1 ? `<span class="hist-badge">${s.history.length}×</span>` : ''}<button class="btn btn-ghost btn-sm" onclick="openSetModal(${gi2})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button></div>
        </div>`;
        })
        .join('')}
    </div>`;
    })
    .join('');

  return `<div class="section">
    <div class="section-header">
      <div class="section-title">Einstellungen</div>
      <div style="display:flex;gap:8px">${editBtn('einstellungen')}</div>
    </div>
    ${em ? `<div class="edit-mode-bar">✏ Felder umbenennen oder löschen. Drag & Drop zum Sortieren. Änderungen gelten für alle Bikes.</div>` : ''}
    ${groupsHtml}
    ${em ? `<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="addSetField()" >+ Neues Feld</button></div>` : ''}
  </div>`;
}

function tabGeometrie(b) {
  ensureBikeGeo(b);
  const em = editMode === 'geometrie';
  const groups = {};
  state.geoDefs.forEach(def => {
    const g = def.group || 'Geometrie';
    if (!groups[g]) groups[g] = [];
    groups[g].push(def);
  });
  const gNames = Object.keys(groups);
  dndGeoGrpNames = gNames;

  const groupsHtml = gNames
    .map((g, gi) => {
      const defs = groups[g];
      if (em) {
        return `<div class="group-card" data-dnd-type="geo-group" data-dnd-idx="${gi}" style="margin-bottom:9px">
        <div class="group-title-row"><div class="drag-handle" data-dnd-type="geo-group" data-dnd-idx="${gi}" onpointerdown="startDrag(event,'geo-group',${gi},${gi})">${HSVG}</div><div class="group-title-text">${esc(g)}</div></div>
        ${defs
          .map(
            (def, di) => `<div class="field-edit-row" data-dnd-type="geo" data-dnd-idx="${di}">
          <div class="drag-handle" data-dnd-type="geo" data-dnd-idx="${di}" onpointerdown="startDrag(event,'geo',${di},${gi});event.stopPropagation()">${HSVG}</div>
          <input class="field-edit-input" value="${esc(def.label)}" onblur="renameGeoField('${def.id}',this.value,document.getElementById('gu_${def.id}').value)" onkeydown="if(event.key==='Enter')this.blur()">
          <input class="field-edit-unit" id="gu_${def.id}" value="${esc(def.unit || '')}" placeholder="Einheit">
          <button class="btn btn-danger btn-sm" onclick="deleteGeoField('${def.id}')">✕</button>
        </div>`
          )
          .join('')}
        <div style="padding:8px 12px"><button class="btn btn-secondary btn-sm" onclick="addGeoField()" >+ Feld</button></div>
      </div>`;
      }
      return `<div class="group-card" style="margin-bottom:9px">
      <div class="group-title-row"><div class="group-title-text">${esc(g)}</div></div>
      ${defs
        .map(def => {
          const geo = b.geometry.find(g => g.defId === def.id);
          const h = geo ? cur(geo.history) : null;
          const gi2 = geo ? b.geometry.indexOf(geo) : -1;
          return `<div class="geo-row">
          <div class="geo-label">${esc(def.label)}${def.unit ? ` <span style="font-size:9.5px;font-weight:400">(${esc(def.unit)})</span>` : ''}</div>
          <div class="geo-val ${!h ? 'empty' : ''}" onclick="${gi2 >= 0 ? `openGeoModal(${gi2})` : ''}">
            ${h ? esc(h.wert) + (def.unit ? ' ' + def.unit : '') : '— klicken'}
          </div>
          <div class="setting-actions">${h && geo.history.length > 1 ? `<span class="hist-badge">${geo.history.length}×</span>` : ''}<button class="btn btn-ghost btn-sm" onclick="${gi2 >= 0 ? `openGeoModal(${gi2})` : ''}" ><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button></div>
        </div>`;
        })
        .join('')}
    </div>`;
    })
    .join('');

  return `<div class="section">
    <div class="section-header">
      <div class="section-title">Geometrie</div>
      ${editBtn('geometrie')}
    </div>
    ${em ? `<div class="edit-mode-bar">✏ Felder umbenennen oder löschen. Drag & Drop zum Sortieren. Änderungen gelten für alle Bikes.</div>` : ''}
    ${groupsHtml}
    ${em ? `<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" onclick="addGeoField()" >+ Neues Feld</button></div>` : ''}
  </div>`;
}

function tabTodos(b) {
  const editSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`;
  return `<div class="section"><div class="section-header"><div class="section-title">ToDo</div><button class="btn btn-secondary btn-sm" onclick="openTodoModal('${b.id}',-1)">+ Aufgabe</button></div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
      ${
        b.todos.length === 0
          ? `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Keine offenen Aufgaben ✓</div>`
          : b.todos
              .map(
                (t, i) =>
                  `<div class="todo-item"><div class="todo-check ${t.done ? 'done' : ''}" onclick="toggleTodo('${b.id}',${i})">${t.done ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>` : ''}</div><div class="todo-text ${t.done ? 'done' : ''}">${t.text}</div><button class="btn btn-ghost btn-sm" onclick="openTodoModal('${b.id}',${i})" style="padding:3px;color:var(--muted)">${editSvg}</button><button class="btn btn-ghost btn-sm" onclick="delTodo('${b.id}',${i})" style="padding:3px;color:var(--muted)">✕</button></div>`
              )
              .join('')
      }
    </div>
  </div>`;
}

// ================================================================
// COMPARE VIEW
// ================================================================

function renderCompare() {
  return `<div class="topbar"><div class="topbar-title">Bike Vergleich</div></div>
  <div class="content">
    <div id="cmp-selectors" style="display:flex;gap:10px;align-items:flex-start;flex-wrap:nowrap;overflow-x:auto;margin-bottom:20px;padding-bottom:6px">
      ${cmpIds.map((id, i) => cmpSelectorHtml(i)).join('')}
      <div style="padding-top:20px">
        <button class="btn btn-secondary btn-sm" onclick="addCmpBike()" title="Weiteres Bike hinzufügen">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </div>
    <div id="cmp-table">${cmpIds.filter(Boolean).length >= 2 ? buildCmpTable() : ''}</div>
  </div>`;
}

function cmpSelectorHtml(i) {
  const canRemove = i >= 2;
  return `<div style="flex:0 0 160px;min-width:160px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <label class="form-label" style="margin:0">Bike ${i + 1}</label>
      ${canRemove ? `<button onclick="removeCmpBike(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0 2px" title="Entfernen">&#x2715;</button>` : ''}
    </div>
    <select class="form-input" data-cmp-bike="${i}" onchange="cmpBikeChanged(this)">${cmpBikeOptions(cmpIds[i])}</select>
    <select class="form-input" data-cmp-snap="${i}" style="margin-top:5px" onchange="cmpSnapChanged(this)">${cmpSnapOptions(cmpIds[i], cmpSnaps[i])}</select>
  </div>`;
}

function cmpBikeOptions(sel) {
  return (
    `<option value="">— wählen —</option>` +
    state.bikes.map(b => `<option value="${b.id}"${sel === b.id ? ' selected' : ''}>${esc(b.marke)} ${esc(b.modell)}</option>`).join('')
  );
}

function cmpSnapOptions(bikeId, selDate) {
  const b = getBike(bikeId);
  if (!b) return `<option value="">— aktuell —</option>`;
  const dates = getCmpDates(b);
  return (
    `<option value=""${!selDate ? ' selected' : ''}>Aktuell</option>` +
    dates.map(d => `<option value="${d.date}"${selDate === d.date ? ' selected' : ''}>${fmtDate(d.date)} · ${d.summary}</option>`).join('')
  );
}

function getCmpDates(b) {
  const dateSet = new Set();
  b.components.forEach(c =>
    c.history.forEach(h => {
      if (h.datum) dateSet.add(h.datum);
    })
  );
  b.settings.forEach(s =>
    s.history.forEach(h => {
      if (h.datum) dateSet.add(h.datum);
    })
  );
  (b.geometry || []).forEach(g =>
    g.history.forEach(h => {
      if (h.datum) dateSet.add(h.datum);
    })
  );
  const dates = [...dateSet].sort();
  return dates
    .map((d, i) => {
      const prev = i > 0 ? dates[i - 1] : null;
      const changed = [];
      b.components.forEach(c => {
        const hN = [...c.history].filter(h => h.datum <= d);
        const hP = prev ? [...c.history].filter(h => h.datum <= prev) : [];
        const vN = hN.length ? hN[hN.length - 1].wert : '';
        const vP = hP.length ? hP[hP.length - 1].wert : '';
        if (vN !== vP && vN) changed.push(c.name);
      });
      b.settings.forEach(s => {
        const hN = [...s.history].filter(h => h.datum <= d);
        const hP = prev ? [...s.history].filter(h => h.datum <= prev) : [];
        const vN = hN.length ? hN[hN.length - 1].wert : '';
        const vP = hP.length ? hP[hP.length - 1].wert : '';
        if (vN !== vP && vN) changed.push(s.label);
      });
      let summary = '';
      if (changed.length === 0) summary = 'Foto/Sonstiges';
      else if (changed.length <= 3) summary = changed.join(', ');
      else summary = changed.slice(0, 3).join(', ') + ` u.a. (${changed.length})`;
      return { date: d, summary };
    })
    .reverse();
}

function stateAtDateForCmp(b, targetDate) {
  const cs = {},
    ss = {},
    gs = {};
  b.components.forEach(c => {
    const hist = targetDate ? [...c.history].filter(h => h.datum <= targetDate) : [...c.history];
    if (hist.length) cs[c.name] = hist[hist.length - 1].wert;
    else if (c.notVorhanden) cs[c.name] = 'Nicht vorhanden';
  });
  b.settings.forEach(s => {
    const hist = targetDate ? [...s.history].filter(h => h.datum <= targetDate) : [...s.history];
    if (hist.length) ss[s.label] = { wert: hist[hist.length - 1].wert, unit: s.unit };
  });
  (b.geometry || []).forEach(g => {
    const def = state.geoDefs.find(d => d.id === g.defId);
    if (!def) return;
    const hist = targetDate ? [...g.history].filter(h => h.datum <= targetDate) : [...g.history];
    if (hist.length) gs[def.label] = { wert: hist[hist.length - 1].wert, unit: def.unit };
  });
  return { cs, ss, gs };
}

function isDiff(...vals) {
  const norm = vals.map(v => (v == null || v === '') ? '' : String(v));
  return new Set(norm).size > 1;
}

function buildCmpTable() {
  const pairs = cmpIds.map((id, i) => ({ id, snap: cmpSnaps[i] || null })).filter(p => p.id);
  if (pairs.length < 2) return '';
  const bikes = pairs.map(p => getBike(p.id));
  const snaps = pairs.map(p => p.snap);
  const states = bikes.map((b, i) => stateAtDateForCmp(b, snaps[i]));
  const gridCols = 'auto ' + bikes.map(() => '1fr').join(' ');

  const rows = [],
    addS = l => rows.push({ s: l }),
    addR = (l, ...vals) => rows.push({ l, vals });

  addS('Allgemein');
  addR('Marke', ...bikes.map(b => b.marke));
  addR('Modell', ...bikes.map(b => b.modell));
  addR('Typ', ...bikes.map(b => b.typ));
  addR('Jahr', ...bikes.map(b => b.jahr));
  addR('Grösse', ...bikes.map(b => b.groesse));
  addR('Federweg', ...bikes.map(b => (b.federweg ? b.federweg + ' mm' : '')));
  addR('Kaufpreis', ...bikes.map(b => (b.preis ? 'CHF ' + b.preis : '')));
  addR('Gewicht gewogen', ...bikes.map(b => (b.gewichtGewogen ? (parseInt(b.gewichtGewogen) / 1000).toFixed(2) + ' kg' : '')));

  const orderedGroups = [];
  bikes.forEach(b =>
    compGroupOrder(b.components).forEach(g => {
      if (!orderedGroups.includes(g)) orderedGroups.push(g);
    })
  );
  orderedGroups.forEach(grp => {
    const orderedNames = [];
    bikes.forEach(b =>
      b.components
        .filter(c => c.group === grp)
        .forEach(c => {
          if (!orderedNames.includes(c.name)) orderedNames.push(c.name);
        })
    );
    let added = false;
    orderedNames.forEach(name => {
      const vals = states.map(s => s.cs[name] || '');
      if (vals.every(v => !v)) return;
      if (!added) {
        addS(grp);
        added = true;
      }
      addR(name, ...vals);
    });
  });

  const setGroups = {};
  bikes.forEach(b =>
    b.settings.forEach(s => {
      const g = s.group || 'Sonstige';
      if (!setGroups[g]) setGroups[g] = [];
      if (!setGroups[g].includes(s.label)) setGroups[g].push(s.label);
    })
  );
  Object.entries(setGroups).forEach(([grp, labels]) => {
    let added = false;
    labels.forEach(label => {
      const entries = states.map(s => s.ss[label]);
      const vals = entries.map(e => (e ? e.wert : ''));
      if (vals.every(v => !v)) return;
      if (!added) {
        addS(grp);
        added = true;
      }
      const unit = (entries.find(e => e && e.unit) || {}).unit || '';
      addR(label + (unit ? ` (${unit})` : ''), ...vals);
    });
  });

  const allGeoLabels = new Set();
  states.forEach(s =>
    Object.keys(s.gs).forEach(l => allGeoLabels.add(l))
  );
  if (allGeoLabels.size) {
    addS('Geometrie');
    allGeoLabels.forEach(l => {
      const entries = states.map(s => s.gs[l]);
      const vals = entries.map(e => (e ? e.wert : ''));
      if (vals.every(v => !v)) return;
      const unit = (entries.find(e => e && e.unit) || {}).unit || '';
      addR(l + (unit ? ` (${unit})` : ''), ...vals);
    });
  }

  const headers = bikes
    .map((b, i) => {
      const lbl = esc(b.marke + ' ' + b.modell.slice(0, 20)) + (snaps[i] ? '<br><span style="font-size:11px;font-weight:400">' + fmtDate(snaps[i]) + '</span>' : '');
      return `<div class="cmp-cell header">${lbl}</div>`;
    })
    .join('');

  return `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div class="compare-grid" style="grid-template-columns:${gridCols};width:max(100%, max-content)">
    <div class="cmp-cell row-label">Feld</div>${headers}
    ${rows
      .map(r => {
        if (r.s) return `<div class="cmp-section" style="grid-column:1/-1">${esc(r.s)}</div>`;
        const diff = isDiff(...r.vals);
        return (
          `<div class="cmp-cell row-label">${esc(r.l)}</div>` +
          r.vals.map(v => `<div class="cmp-cell ${diff ? 'cmp-diff' : ''}">${v ? esc(v) : '<span style="color:var(--muted);font-style:italic">—</span>'}</div>`).join('')
        );
      })
      .join('')}
  </div></div>`;
}

function addCmpBike() {
  cmpIds.push('');
  cmpSnaps.push('');
  const sel = document.getElementById('cmp-selectors');
  if (sel) {
    sel.innerHTML =
      cmpIds.map((id, i) => cmpSelectorHtml(i)).join('') +
      `<div style="padding-top:20px"><button class="btn btn-secondary btn-sm" onclick="addCmpBike()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>`;
  }
}

function removeCmpBike(i) {
  cmpIds.splice(i, 1);
  cmpSnaps.splice(i, 1);
  const sel = document.getElementById('cmp-selectors');
  if (sel) {
    sel.innerHTML =
      cmpIds.map((id, i2) => cmpSelectorHtml(i2)).join('') +
      `<div style="padding-top:20px"><button class="btn btn-secondary btn-sm" onclick="addCmpBike()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>`;
  }
  renderCmpTable();
}

function cmpBikeChanged(el) {
  const i = parseInt(el.dataset.cmpBike);
  cmpIds[i] = el.value;
  cmpSnaps[i] = '';
  const snapSel = document.querySelector('[data-cmp-snap="' + i + '"]');
  if (snapSel) snapSel.innerHTML = cmpSnapOptions(cmpIds[i], '');
  renderCmpTable();
}

function cmpSnapChanged(el) {
  const i = parseInt(el.dataset.cmpSnap);
  cmpSnaps[i] = el.value;
  renderCmpTable();
}

function renderCmpTable() {
  const t = document.getElementById('cmp-table');
  if (t) t.innerHTML = cmpIds.filter(Boolean).length >= 2 ? buildCmpTable() : '';
}

// ================================================================
// PERSONAL & GALLERY
// ================================================================

function renderPersonal() {
  return `<div class="topbar"><div class="topbar-title">Persönliche Infos</div><button class="btn btn-primary btn-sm" onclick="savePersonal()">Speichern</button></div>
  <div class="content"><div class="section"><div class="section-header"><div class="section-title">Notizen & Körpermasse</div></div>
    <div class="rich-toolbar"><button class="rich-btn" onclick="document.execCommand('bold')"><b>B</b></button><button class="rich-btn" onclick="document.execCommand('italic')"><i>I</i></button><button class="rich-btn" onclick="document.execCommand('underline')"><u>U</u></button><button class="rich-btn" onclick="document.execCommand('insertUnorderedList')">• Liste</button><button class="rich-btn" onclick="document.execCommand('formatBlock',false,'h3')">H3</button><button class="rich-btn" onclick="document.execCommand('formatBlock',false,'p')">Normal</button></div>
    <div id="personal-editor" contenteditable="true" oninput="markDirty('Persönliche Infos')">${state.personalInfo || '<p>Hier kannst du persönliche Infos eintragen...</p>'}</div>
  </div></div>`;
}

let galDayMin = 0,
  galDayMax = 0;

function getGalleryPhotos() {
  const photos = [];
  state.bikes.forEach(b => {
    b.fotos.forEach(f => {
      const src = typeof f === 'string' ? f : f.data;
      const datum = typeof f === 'string' ? null : f.datum;
      photos.push({ src, datum, bikeId: b.id, label: b.marke + ' ' + b.modell });
    });
  });
  photos.sort((a, b) => ((b.datum || '') > (a.datum || '') ? 1 : (b.datum || '') < (a.datum || '') ? -1 : 0));
  return photos;
}

function buildGalleryGrid() {
  const photos = getGalleryPhotos();
  const from = dayToDate(galDayMin),
    to = dayToDate(galDayMax);
  const filtered = photos.filter(p => p.datum && p.datum >= from && p.datum <= to);
  if (!filtered.length) return `<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">Keine Fotos im gewählten Zeitraum.</div>`;
  window._galSrcs = filtered.map(p => p.src);
  return `<div class="gal-grid">${filtered.map((p, i) => `<div class="gal-item"><div class="gal-thumb" onclick="openLightbox(window._galSrcs[${i}])"><img src="${p.src}" loading="lazy"></div><div class="gal-caption"><a onclick="goToSnap('${p.bikeId}','${p.datum || ''}')">${esc(p.label)}</a>${p.datum ? `<div class="gal-date">${fmtDate(p.datum)}</div>` : ''}</div></div>`).join('')}</div>`;
}

function updateGalRange() {
  const s1 = document.getElementById('gal-r1'),
    s2 = document.getElementById('gal-r2');
  if (!s1 || !s2) return;
  let v1 = parseInt(s1.value),
    v2 = parseInt(s2.value);
  if (v1 > v2) {
    const tmp = v1;
    v1 = v2;
    v2 = tmp;
  }
  galDayMin = v1;
  galDayMax = v2;
  const pct1 = ((v1 - parseInt(s1.min)) / (parseInt(s1.max) - parseInt(s1.min))) * 100;
  const pct2 = ((v2 - parseInt(s1.min)) / (parseInt(s1.max) - parseInt(s1.min))) * 100;
  const fill = document.getElementById('gal-fill');
  if (fill) {
    fill.style.left = pct1 + '%';
    fill.style.width = pct2 - pct1 + '%';
  }
  const lMin = document.getElementById('gal-lmin'),
    lMax = document.getElementById('gal-lmax');
  if (lMin) lMin.textContent = fmtDate(dayToDate(v1));
  if (lMax) lMax.textContent = fmtDate(dayToDate(v2));
  const grid = document.getElementById('gal-grid');
  if (grid) grid.innerHTML = buildGalleryGrid();
}

function renderGallery() {
  const photos = getGalleryPhotos();
  const dated = photos.filter(p => p.datum);
  if (!dated.length)
    return `<div class="topbar"><div class="topbar-title">Galerie</div></div><div class="content"><div class="empty-state"><h3>Keine Fotos</h3><p>Füge Fotos mit Datum zu deinen Bikes hinzu.</p></div></div>`;
  const days = dated.map(p => dateToDay(p.datum));
  const dMin = Math.min(...days),
    dMax = Math.max(...days);
  if (galDayMin === 0 && galDayMax === 0) {
    galDayMin = dMin;
    galDayMax = dMax;
  }
  galDayMin = Math.max(galDayMin, dMin);
  galDayMax = Math.min(galDayMax, dMax);
  const pct1 = ((galDayMin - dMin) / (dMax - dMin || 1)) * 100;
  const pct2 = ((galDayMax - dMin) / (dMax - dMin || 1)) * 100;
  return `<div class="topbar"><div class="topbar-title">Galerie</div></div>
  <div class="content">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;margin-bottom:16px">
      <div class="dual-range">
        <div class="dual-range-track"><div class="dual-range-fill" id="gal-fill" style="left:${pct1}%;width:${pct2 - pct1}%"></div></div>
        <input type="range" id="gal-r1" min="${dMin}" max="${dMax}" value="${galDayMin}" oninput="updateGalRange()">
        <input type="range" id="gal-r2" min="${dMin}" max="${dMax}" value="${galDayMax}" oninput="updateGalRange()">
      </div>
      <div class="range-labels"><span id="gal-lmin">${fmtDate(dayToDate(galDayMin))}</span><span id="gal-lmax">${fmtDate(dayToDate(galDayMax))}</span></div>
    </div>
    <div id="gal-grid">${buildGalleryGrid()}</div>
  </div>`;
}

// ================================================================
// TIMELINE
// ================================================================

function buildZeitstrahlHtml(b) {
  const dateMap = {};
  b.components.forEach(c => {
    c.history.forEach(h => {
      if (h.datum && h.wert) {
        if (!dateMap[h.datum]) dateMap[h.datum] = { label: '', changes: [] };
      }
    });
  });
  b.settings.forEach(s => {
    s.history.forEach(h => {
      if (h.datum && h.wert) {
        if (!dateMap[h.datum]) dateMap[h.datum] = { label: '', changes: [] };
      }
    });
  });
  b.fotos.forEach(f => {
    const d = typeof f === 'string' ? null : f.datum;
    if (d && !dateMap[d]) dateMap[d] = { label: '', changes: [] };
  });

  const dates = Object.keys(dateMap).sort();
  if (!dates.length)
    return `<div class="empty-state"><h3>Keine Einträge</h3><p>Erfasse Komponenten mit Datum um den Zeitstrahl zu sehen.</p></div>`;

  function stateAtDate(targetDate) {
    const compState = {},
      setState = {};
    b.components.forEach(c => {
      const hist = [...c.history].filter(h => h.datum <= targetDate);
      if (hist.length) compState[c.name] = { wert: hist[hist.length - 1].wert, gewicht: hist[hist.length - 1].gewicht };
    });
    b.settings.forEach(s => {
      const hist = [...s.history].filter(h => h.datum <= targetDate);
      if (hist.length) setState[s.label] = { wert: hist[hist.length - 1].wert, unit: s.unit };
    });
    return { compState, setState };
  }

  function changesAtDate(targetDate, prevDate) {
    const curr = stateAtDate(targetDate);
    const prev = prevDate ? stateAtDate(prevDate) : { compState: {}, setState: {} };
    const changes = [];
    Object.entries(curr.compState).forEach(([name, v]) => {
      const pv = prev.compState[name];
      if (!pv || pv.wert !== v.wert) changes.push({ type: 'comp', name, wert: v.wert, gewicht: v.gewicht });
    });
    Object.entries(curr.setState).forEach(([label, v]) => {
      const pv = prev.setState[label];
      if (!pv || pv.wert !== v.wert) changes.push({ type: 'set', name: label, wert: v.wert, unit: v.unit });
    });
    return changes;
  }

  const reversedDates = dates.slice().reverse();
  const html = reversedDates
    .map((d, idx) => {
      const timeIdx = dates.indexOf(d);
      const prevDate = timeIdx > 0 ? dates[timeIdx - 1] : null;
      const nextDate = timeIdx < dates.length - 1 ? dates[timeIdx + 1] : null;
      const changes = changesAtDate(d, prevDate);
      const fotoArr = photosForSnapshot(b, d, nextDate);
      const { compState, setState } = stateAtDate(d);

      const compChanges = changes.filter(c => c.type === 'comp');
      const setChanges = changes.filter(c => c.type === 'set');

      const uid3 = 'z' + Math.random().toString(36).slice(2);
      const ssId = 'ss' + Math.random().toString(36).slice(2);
      if (fotoArr.length) _ssRegistry[ssId] = { fotos: fotoArr, idx: 0 };
      const fotoHtml =
        fotoArr.length > 0
          ? `<div id="${ssId}" style="margin-bottom:10px">
      <img src="${fotoArr[0]}" style="width:100%;max-width:320px;height:180px;object-fit:cover;border-radius:8px;border:1px solid var(--border);transition:opacity .2s">
      ${fotoArr.length > 1 ? `<div class="ss-dots">${fotoArr.map((_,i) => `<span class="ss-dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>` : ''}
    </div>`
          : '';

      return `<div id="snap-${d}" style="display:flex;gap:14px;margin-bottom:22px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:0">
        <div style="width:12px;height:12px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:4px"></div>
        <div style="width:2px;flex:1;background:var(--border);margin-top:4px"></div>
      </div>
      <div style="flex:1;padding-bottom:8px">
        <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent);margin-bottom:8px">${fmtDate(d)}</div>
        ${fotoHtml}
        ${
          changes.length === 0
            ? `<div style="font-size:12px;color:var(--muted);font-style:italic">Foto hinzugefügt</div>`
            : `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px">
          ${
            compChanges.length
              ? `<div style="padding:7px 12px;background:var(--surface2);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">Komponenten</div>
          ${compChanges.map(c => `<div style="padding:8px 12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:baseline">
            <div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;min-width:110px;flex-shrink:0">${esc(c.name)}</div>
            <div style="font-size:12.5px;flex:1">${esc(c.wert)}</div>
            ${c.gewicht ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">${c.gewicht}g</div>` : ''}
          </div>`).join('')}`
              : ''
          }
          ${
            setChanges.length
              ? `<div style="padding:7px 12px;background:var(--surface2);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">Einstellungen</div>
          ${setChanges.map(c => `<div style="padding:8px 12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:baseline">
            <div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;min-width:110px;flex-shrink:0">${esc(c.name)}</div>
            <div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:600">${esc(c.wert)}${c.unit ? ' ' + c.unit : ''}</div>
          </div>`).join('')}`
              : ''
          }
        </div>`
        }
        <div class="hist-toggle" onclick="const c=document.getElementById('${uid3}');const o=c.style.display!=='none';c.style.display=o?'none':'block';this.querySelector('.hist-icon').style.transform=o?'rotate(0)':'rotate(90deg)'" style="border-top:none;padding:4px 0">
          <span class="hist-icon">▶</span>Vollständiger Zustand
        </div>
        <div id="${uid3}" style="display:none;padding-top:8px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden">
            ${Object.entries(compState).map(([name, v]) => `<div style="padding:7px 12px;border-bottom:1px solid var(--border);display:flex;gap:8px">
              <div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;min-width:110px;flex-shrink:0">${esc(name)}</div>
              <div style="font-size:12px;flex:1">${esc(v.wert)}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
    })
    .join('');

  return html || '<p style="color:var(--muted);font-size:13px;padding:12px 0">Noch keine Einträge mit Datum.</p>';
}
