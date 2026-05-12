// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cur(h) {
  return h && h.length ? h[h.length - 1] : null;
}

function fmtDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString('de-CH') : '';
  } catch {
    return d || '';
  }
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function vv(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function lastPhoto(b) {
  if (!b.fotos || !b.fotos.length) return null;
  const f = b.fotos[b.fotos.length - 1];
  return typeof f === 'string' ? f : f.data;
}

function lastPhotoForDate(b, datumStr) {
  // newest photo whose datum <= datumStr, or first photo if none dated
  if (!b.fotos || !b.fotos.length) return null;
  const candidates = b.fotos.filter(f => {
    const d = typeof f === 'string' ? null : f.datum;
    return !d || d <= datumStr;
  });
  if (!candidates.length) return null;
  const f = candidates[candidates.length - 1];
  return typeof f === 'string' ? f : f.data;
}

function photoDate(f) {
  return typeof f === 'string' ? null : f.datum;
}

function readExifDate(buf) {
  try {
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return null;
    let off = 2;
    while (off + 4 <= v.byteLength) {
      const marker = v.getUint16(off);
      if (marker === 0xFFE1) {
        if (v.getUint32(off + 4) === 0x45786966 && v.getUint16(off + 8) === 0) {
          const tiff = off + 10;
          const le = v.getUint16(tiff) === 0x4949;
          const u16 = (o) => v.getUint16(tiff + o, le);
          const u32 = (o) => v.getUint32(tiff + o, le);
          const ifd0 = u32(4);
          const n0 = u16(ifd0);
          let exifPtr = null;
          for (let i = 0; i < n0; i++) {
            const e = ifd0 + 2 + i * 12;
            if (u16(e) === 0x8769) {
              exifPtr = u32(e + 8);
              break;
            }
          }
          if (exifPtr !== null) {
            const ne = u16(exifPtr);
            for (let i = 0; i < ne; i++) {
              const e = exifPtr + 2 + i * 12;
              if (u16(e) === 0x9003) {
                const vOff = u32(e + 8);
                let s = '';
                for (let j = 0; j < 10; j++) s += String.fromCharCode(v.getUint8(tiff + vOff + j));
                if (/^\d{4}:\d{2}:\d{2}$/.test(s))
                  return s.slice(0, 4) + '-' + s.slice(5, 7) + '-' + s.slice(8, 10);
              }
            }
          }
        }
      }
      if (off + 2 >= v.byteLength) break;
      const segLen = v.getUint16(off + 2);
      off += 2 + segLen;
    }
  } catch (e) {}
  return null;
}

function photosForSnapshot(b, date, nextDate) {
  return b.fotos
    .filter(f => {
      const d = typeof f === 'string' ? null : f.datum;
      if (!d) return false;
      return d >= date && (nextDate === null || d < nextDate);
    })
    .map(f => (typeof f === 'string' ? f : f.data));
}

let _ssTimers = [],
  _ssRegistry = {};

function clearSlideshows() {
  _ssTimers.forEach(t => clearInterval(t));
  _ssTimers = [];
  _ssRegistry = {};
}

function initSlideshows() {
  Object.entries(_ssRegistry).forEach(([id, ss]) => {
    if (ss.fotos.length < 2) return;
    const t = setInterval(() => {
      const el = document.getElementById(id);
      if (!el) {
        clearInterval(t);
        return;
      }
      ss.idx = (ss.idx + 1) % ss.fotos.length;
      const img = el.querySelector('img');
      const dots = el.querySelectorAll('.ss-dot');
      if (img) {
        img.style.opacity = '0';
        setTimeout(() => {
          img.src = ss.fotos[ss.idx];
          img.style.opacity = '1';
        }, 200);
      }
      dots.forEach((d, i) => d.classList.toggle('active', i === ss.idx));
    }, 5000);
    _ssTimers.push(t);
  });
}

function compGroupOrder(comps) {
  const seen = new Set(),
    o = [];
  comps.forEach(c => {
    if (!seen.has(c.group)) {
      seen.add(c.group);
      o.push(c.group);
    }
  });
  return o;
}

function setGroupOrder(sets) {
  const seen = new Set(),
    o = [];
  sets.forEach(s => {
    const g = s.group || 'Sonstige';
    if (!seen.has(g)) {
      seen.add(g);
      o.push(g);
    }
  });
  return o;
}

function dateToDay(s) {
  return s ? Math.floor(new Date(s).getTime() / 86400000) : 0;
}

function dayToDate(d) {
  return new Date(d * 86400000).toISOString().slice(0, 10);
}

function defaultGeoDefs() {
  return [
    { id: 'g01', label: 'Reach', unit: 'mm', group: 'Geometrie' },
    { id: 'g02', label: 'Stack', unit: 'mm', group: 'Geometrie' },
    { id: 'g03', label: 'Effective TT', unit: 'mm', group: 'Geometrie' },
    { id: 'g04', label: 'Head Tube Angle', unit: '°', group: 'Geometrie' },
    { id: 'g05', label: 'Seat Tube Angle', unit: '°', group: 'Geometrie' },
    { id: 'g06', label: 'Chainstay', unit: 'mm', group: 'Geometrie' },
    { id: 'g07', label: 'Wheelbase', unit: 'mm', group: 'Geometrie' },
    { id: 'g08', label: 'BB Drop', unit: 'mm', group: 'Geometrie' },
    { id: 'g09', label: 'Lenkerlänge', unit: 'mm', group: 'Cockpit' },
    { id: 'g10', label: 'Vorbaulänge', unit: 'mm', group: 'Cockpit' },
    { id: 'g11', label: 'Sattelrohrlänge', unit: 'mm', group: 'Rahmen' },
    { id: 'g12', label: 'Steuerrohr', unit: 'mm', group: 'Rahmen' },
  ];
}

function ensureGeoDefs() {
  if (!state.geoDefs || !state.geoDefs.length) state.geoDefs = defaultGeoDefs();
}

function ensureBikeGeo(b) {
  ensureGeoDefs();
  if (!b.geometry) b.geometry = [];
  // add missing defs
  state.geoDefs.forEach(def => {
    if (!b.geometry.find(g => g.defId === def.id)) {
      b.geometry.push({ defId: def.id, history: [] });
    }
  });
  // remove orphans
  b.geometry = b.geometry.filter(g => state.geoDefs.find(d => d.id === g.defId));
}
