// ================================================================
// STATE INITIALIZATION & PERSISTENCE
// ================================================================

const KEY = 'velodb_v6';

let state = (() => {
  try {
    const r = localStorage.getItem(KEY);
    if (r) return JSON.parse(r);
  } catch {}
  return null;
})();

if (!state) {
  state = {
    version: 12,
    personalInfo: '',
    bikes: [],
    geoDefs: defaultGeoDefs(),
    infoDefs: DEFAULT_INFO_DEFS.map(d => ({ ...d })),
  };
  localStorage.setItem(KEY, JSON.stringify(state));
}

// migrate old data
ensureGeoDefs();
if (!state.infoDefs) state.infoDefs = DEFAULT_INFO_DEFS.map(d => ({ ...d }));
state.infoDefs.forEach(d => {
  if ((d.id === 'aktuellerZustand' || d.id === 'bemerkungen') && d.type === 'textarea') d.type = 'richtext';
});
state.bikes.forEach(b => {
  b.components.forEach(c => {
    if (c.notVorhanden === undefined) c.notVorhanden = false;
  });
  b.fotos = (b.fotos || []).map(f =>
    typeof f === 'string' ? { data: f, datum: today() } : f
  );
  if (b.aktuelleProbleme !== undefined && b.aktuellerZustand === undefined) {
    b.aktuellerZustand = b.aktuelleProbleme;
    delete b.aktuelleProbleme;
  }
  if (!b.geometry) b.geometry = [];
  if (b.variante === undefined) b.variante = '';
  if (b.bezugsdatum === undefined) b.bezugsdatum = '';
  if (b.listenpreis === undefined) b.listenpreis = '';
  if (b.radgroesseV === undefined) b.radgroesseV = '';
  if (b.radgroesseH === undefined) b.radgroesseH = '';
  if (!b.infoVals) b.infoVals = {};
  ensureBikeGeo(b);
});

// ================================================================
// AUTOSAVE / DIRTY STATE
// ================================================================

let dirtyField = null,
  dirtyTimer = null;

function saveState(c = true) {
  localStorage.setItem(KEY, JSON.stringify(state));
  dirtyField = null;
  if (dirtyTimer) clearTimeout(dirtyTimer);
  hideBanner();
  if (c) showToast('Gespeichert ✓');
}

function markDirty(l) {
  dirtyField = l;
  if (dirtyTimer) clearTimeout(dirtyTimer);
  document.getElementById('sb-info').textContent = '"' + l + '" wurde verändert.';
  document.getElementById('save-banner').style.display = 'block';
  dirtyTimer = setTimeout(() => {
    doSave();
  }, 5 * 60 * 1000);
}

function hideBanner() {
  document.getElementById('save-banner').style.display = 'none';
}

function doSave() {
  saveState(true);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => (t.style.opacity = '0'), 2200);
}

window.addEventListener('beforeunload', e => {
  if (dirtyField) {
    e.preventDefault();
    e.returnValue = '';
  }
});
