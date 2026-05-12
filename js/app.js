// ================================================================
// CONSTANTS
// ================================================================

const COMP_GROUPS = [
  { group: 'Rahmen & Federung', items: ['Rahmen', 'Gabel', 'Dämpfer'] },
  {
    group: 'Antrieb',
    items: [
      'Kurbelgarnitur',
      'Innenlager',
      'Pedale',
      'Kettenblatt',
      'Schaltwerk',
      'Kassette',
      'Schalthebel',
      'Kettenführung',
      'Kette',
    ],
  },
  {
    group: 'Bremsen',
    items: [
      'Bremsen vorne',
      'Bremsen hinten',
      'Bremsscheibe vorne',
      'Bremsscheibe hinten',
      'Bremsgriff vorne',
      'Bremsgriff hinten',
      'Bremsbeläge vorne',
      'Bremsbeläge hinten',
      'Bremsschläuche',
    ],
  },
  {
    group: 'Räder',
    items: [
      'Laufrad vorne',
      'Laufrad hinten',
      'Reifen vorne',
      'Reifen hinten',
      'Ventil/Schlauch vorne',
      'Ventil/Schlauch hinten',
      'Mudguard vorne',
      'Mudguard hinten',
    ],
  },
  { group: 'Cockpit', items: ['Steuersatz', 'Vorbau', 'Lenker', 'Griffe', 'Zubehör 1', 'Zubehör 2'] },
  { group: 'Sattel', items: ['Sattel', 'Sattelstütze', 'Sattelklemme'] },
  { group: 'E-Bike', items: ['Motor', 'Display', 'Akku', 'Ladegerät'] },
];

// For each setting label, list which component names to show as reference
const SETTING_COMP_MAP = {
  'Gabel Luftdruck': ['Gabel'],
  'Gabel Tokens': ['Gabel'],
  'Gabel Zugstufe': ['Gabel'],
  'Gabel Druckstufe': ['Gabel'],
  'Gabel Sag': ['Gabel'],
  'Dämpfer Luftdruck': ['Dämpfer'],
  'Dämpfer Tokens': ['Dämpfer'],
  'Dämpfer Zugstufe': ['Dämpfer'],
  'Dämpfer Druckstufe': ['Dämpfer'],
  'Dämpfer Sag': ['Dämpfer'],
  'Reifendruck vorne': ['Reifen vorne', 'Ventil/Schlauch vorne'],
  'Reifendruck hinten': ['Reifen hinten', 'Ventil/Schlauch hinten'],
};

const STD_SETTINGS = [
  { label: 'Gabel Luftdruck', unit: 'PSI', group: 'Gabel' },
  { label: 'Gabel Tokens', unit: 'Stk.', group: 'Gabel' },
  { label: 'Gabel Zugstufe', unit: 'Klicks', group: 'Gabel' },
  { label: 'Gabel Druckstufe', unit: 'Klicks', group: 'Gabel' },
  { label: 'Gabel Sag', unit: 'mm', group: 'Gabel' },
  { label: 'Dämpfer Luftdruck', unit: 'PSI', group: 'Dämpfer' },
  { label: 'Dämpfer Tokens', unit: 'Stk.', group: 'Dämpfer' },
  { label: 'Dämpfer Zugstufe', unit: 'Klicks', group: 'Dämpfer' },
  { label: 'Dämpfer Druckstufe', unit: 'Klicks', group: 'Dämpfer' },
  { label: 'Dämpfer Sag', unit: 'mm', group: 'Dämpfer' },
  { label: 'Reifendruck vorne', unit: 'Bar', group: 'Reifen' },
  { label: 'Reifendruck hinten', unit: 'Bar', group: 'Reifen' },
];

const DEFAULT_INFO_DEFS = [
  { id: 'marke', label: 'Marke', type: 'text', isStandard: true },
  { id: 'modell', label: 'Modell', type: 'text', isStandard: true },
  { id: 'variante', label: 'Variante', type: 'text', isStandard: true },
  { id: 'jahr', label: 'Modelljahr', type: 'text', isStandard: true },
  { id: 'typ', label: 'Typ', type: 'text', isStandard: true },
  { id: 'farbe', label: 'Farbe', type: 'text', isStandard: true },
  { id: 'radgroesse', label: 'Radgrösse v / h', type: 'radgroesse', isStandard: true },
  { id: 'gewicht', label: 'Gewicht gew. / ber.', type: 'gewicht', isStandard: true },
  { id: 'bezug', label: 'Bezugsquelle', type: 'text', isStandard: true },
  { id: 'bezugsdatum', label: 'Bezugsdatum', type: 'date', isStandard: true },
  { id: 'preis', label: 'Kaufpreis (CHF)', type: 'number', isStandard: true },
  { id: 'listenpreis', label: 'Listenpreis (CHF)', type: 'number', isStandard: true },
  { id: 'aktuellerZustand', label: 'Aktueller Zustand', type: 'textarea', isStandard: true },
  { id: 'bemerkungen', label: 'Bemerkungen', type: 'textarea', isStandard: true },
];

function newBike(o = {}) {
  return {
    id: uid(),
    status: 'aktiv',
    marke: '',
    modell: '',
    variante: '',
    typ: '',
    jahr: '',
    farbe: '',
    radgroesseV: '',
    radgroesseH: '',
    groesse: '',
    bezug: '',
    bezugsdatum: '',
    preis: '',
    listenpreis: '',
    federweg: '',
    gewichtGewogen: '',
    fotos: [],
    aktuellerZustand: '',
    bemerkungen: '',
    infoVals: {},
    components: COMP_GROUPS.flatMap(g =>
      g.items.map(name => ({ group: g.group, name, history: [], notVorhanden: false }))
    ),
    settings: STD_SETTINGS.map(s => ({ ...s, isStandard: true, history: [] })),
    geometry: [],
    todos: [],
    ...o,
  };
}

// ================================================================
// DND — group names in arrays to avoid HTML escaping issues
// ================================================================

let dndCompGrpNames = [];
let dndSetGrpNames = [];
let dndGeoGrpNames = [];
let dndInfoFields = [];

// ================================================================
// APP STATE GLOBALS
// ================================================================

let view = 'overview',
  bikeId = null,
  tab = 'info',
  filter = 'aktiv',
  cmpIds = ['', ''],
  cmpSnaps = ['', ''];

let _snapTarget = null;

// ================================================================
// NAVIGATION
// ================================================================

function navigate(v, id = null, t = 'info') {
  view = v;
  bikeId = id;
  tab = t;
  document.querySelectorAll('.nav-item[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === v));
  buildBikeLinks();
  render();
  window.scrollTo(0, 0);
}

function buildBikeLinks() {
  const el = document.getElementById('bike-links');
  if (!el) return;
  const active = state.bikes.filter(b => b.status === 'aktiv');
  el.innerHTML = active
    .map(
      b =>
        `<div class="nav-item bike-link ${bikeId === b.id && view === 'bike' ? 'active' : ''}" onclick="navigate('bike','${b.id}')"><span class="bike-dot"></span>${esc(b.marke)} ${esc(b.modell) || 'Unbenannt'}</div>`
    )
    .join('');
}

// ================================================================
// BIKE OPERATIONS
// ================================================================

function getBike(id) {
  return state.bikes.find(b => b.id === id);
}

function setFilter(f) {
  filter = f;
  render();
}

function addBike() {
  const b = newBike();
  state.bikes.push(b);
  markDirty('Neues Bike');
  buildBikeLinks();
  navigate('bike', b.id, 'info');
}

function deleteBike(id) {
  if (!confirm('Bike wirklich löschen?')) return;
  state.bikes = state.bikes.filter(b => b.id !== id);
  saveState(true);
  buildBikeLinks();
  navigate('overview');
}

function retireBike(id) {
  const b = getBike(id);
  b.status = b.status === 'aktiv' ? 'ausgemustert' : 'aktiv';
  markDirty('Status');
  buildBikeLinks();
  navigate('bike', id, tab);
}

// ================================================================
// INIT
// ================================================================

function initApp() {
  buildBikeLinks();
  navigate('overview');
}
