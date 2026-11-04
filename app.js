'use strict';

/* Kalkulator Nilai Akhir SMK — vanilla JS, tanpa dependency. */

const STORAGE_KEY = 'nilaiAkhirSmk_v1';
const DEFAULT_BOBOT = { bobotTugas: 20, bobotUTS: 25, bobotUAS: 35, bobotPraktik: 20 };
const DEFAULT_ROWS = [
  { nama: 'Matematika', tugas: '', uts: '', uas: '', praktik: '', ...DEFAULT_BOBOT },
  { nama: 'Bahasa Indonesia', tugas: '', uts: '', uas: '', praktik: '', ...DEFAULT_BOBOT },
  { nama: 'Produktif Kejuruan', tugas: '', uts: '', uas: '', praktik: '', ...DEFAULT_BOBOT },
];

const tbody = document.getElementById('tbody');
const kkmInput = document.getElementById('kkm');
const globalWarning = document.getElementById('globalWarning');
const heroFinal = document.getElementById('heroFinal');
const heroPredikat = document.getElementById('heroPredikat');
const heroStatus = document.getElementById('heroStatus');
const toggleThemeBtn = document.getElementById('toggleTheme');
const toggleBobotBtn = document.getElementById('toggleBobot');
const gradeTable = document.getElementById('gradeTable');

let rows = [];

/* ---------- Util ---------- */
const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
};
const escapeCsv = (s) => {
  const t = String(s ?? '');
  return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
};

function predikat(nilai) {
  if (nilai === null) return '–';
  if (nilai >= 86) return 'A';
  if (nilai >= 71) return 'B';
  if (nilai >= 56) return 'C';
  if (nilai >= 41) return 'D';
  return 'E';
}

function hitungNilaiAkhir(r) {
  const tugas = num(r.tugas), uts = num(r.uts), uas = num(r.uas), praktik = num(r.praktik);
  const bt = num(r.bobotTugas) ?? 0, bu = num(r.bobotUTS) ?? 0, ba = num(r.bobotUAS) ?? 0, bp = num(r.bobotPraktik) ?? 0;
  const totalBobot = bt + bu + ba + bp;
  if (totalBobot !== 100) return { nilai: null, totalBobot, valid: false };
  const parts = [[tugas, bt], [uts, bu], [uas, ba], [praktik, bp]];
  let sum = 0, weightUsed = 0;
  for (const [v, w] of parts) {
    if (v !== null && w > 0) { sum += v * w; weightUsed += w; }
  }
  if (weightUsed === 0) return { nilai: null, totalBobot, valid: true };
  return { nilai: sum / weightUsed, totalBobot, valid: true };
}

/* ---------- Render ---------- */
function render() {
  tbody.innerHTML = '';
  const kkm = clamp(num(kkmInput.value) ?? 75, 0, 100);
  let sumFinal = 0, countFinal = 0, anyInvalid = false;

  rows.forEach((r, i) => {
    const { nilai, totalBobot, valid } = hitungNilaiAkhir(r);
    if (!valid) anyInvalid = true;
    if (nilai !== null) { sumFinal += nilai; countFinal++; }

    const pred = predikat(nilai);
    const lulus = nilai !== null && nilai >= kkm;

    const tr = el('tr', { 'data-index': String(i) });

    tr.append(el('td', { class: 'col-num', 'data-label': 'No' }, String(i + 1)));

    const namaTd = el('td', { class: 'name', 'data-label': 'Mata Pelajaran' });
    namaTd.append(el('input', {
      type: 'text', value: r.nama, placeholder: 'Nama mapel…', autocomplete: 'off',
      'aria-label': 'Nama mata pelajaran baris ' + (i + 1),
      oninput: (e) => { rows[i].nama = e.target.value; persist(); },
    }));
    tr.append(namaTd);

    const mkNumCell = (field, label, min, max, extraClass = '') => {
      const td = el('td', { class: extraClass, 'data-label': label });
      const inp = el('input', {
        type: 'number', min: String(min), max: String(max), step: '0.5',
        value: r[field], inputmode: 'decimal', placeholder: '–',
        'aria-label': label + ' baris ' + (i + 1),
        oninput: (e) => { rows[i][field] = e.target.value; onRowChange(); },
      });
      const v = num(r[field]);
      if (v !== null && (v < min || v > max)) inp.classList.add('invalid');
      td.append(inp);
      return td;
    };
    tr.append(mkNumCell('tugas', 'Tugas', 0, 100));
    tr.append(mkNumCell('uts', 'UTS', 0, 100));
    tr.append(mkNumCell('uas', 'UAS', 0, 100));
    tr.append(mkNumCell('praktik', 'Praktik', 0, 100));
    tr.append(mkNumCell('bobotTugas', 'Bobot Tugas %', 0, 100, 'weight-col'));
    tr.append(mkNumCell('bobotUTS', 'Bobot UTS %', 0, 100, 'weight-col'));
    tr.append(mkNumCell('bobotUAS', 'Bobot UAS %', 0, 100, 'weight-col'));
    tr.append(mkNumCell('bobotPraktik', 'Bobot Praktik %', 0, 100, 'weight-col'));

    tr.append(el('td', { class: 'weight-col ' + (totalBobot === 100 ? 'sum-ok' : 'sum-bad'), 'data-label': 'Total Bobot' }, totalBobot + '%'));
    tr.append(el('td', { class: 'cell-final', 'data-label': 'Nilai Akhir' },
      el('span', { class: 'final-cell' }, nilai === null ? '–' : nilai.toFixed(2))));

    const predTd = el('td', { 'data-label': 'Predikat' });
    predTd.append(nilai === null
      ? document.createTextNode('–')
      : el('span', { class: 'badge badge-' + pred }, pred));
    tr.append(predTd);

    tr.append(el('td', { class: nilai === null ? '' : (lulus ? 'status-pass' : 'status-fail'), 'data-label': 'Status' },
      nilai === null ? '–' : (lulus ? 'Lulus' : 'Remedial')));

    const delTd = el('td', { class: 'cell-delete' });
    delTd.append(el('button', {
      type: 'button', class: 'row-delete', title: 'Hapus mapel', 'aria-label': 'Hapus baris ' + (i + 1),
      onclick: () => { rows.splice(i, 1); persist(); render(); },
    }, '🗑️'));
    tr.append(delTd);

    tbody.append(tr);
  });

  if (anyInvalid) {
    globalWarning.hidden = false;
    globalWarning.textContent = '⚠️ Ada mapel dengan total bobot bukan 100%. Nilai akhir mapel itu belum dihitung.';
  } else {
    globalWarning.hidden = true;
  }

  const avg = countFinal ? sumFinal / countFinal : null;
  heroFinal.textContent = avg === null ? '–' : avg.toFixed(2);
  heroPredikat.textContent = predikat(avg);
  heroStatus.textContent = avg === null ? '–' : (avg >= kkm ? 'Lulus' : 'Remedial');
  heroStatus.className = 'hero-chip-value ' + (avg === null ? '' : (avg >= kkm ? 'ok' : 'bad'));
}

let rafPending = false;
function onRowChange() {
  persist();
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => { rafPending = false; render(); });
}

/* ---------- Persist ---------- */
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ kkm: kkmInput.value, rows, theme: document.documentElement.dataset.theme }));
  } catch (_) { /* quota / private mode */ }
}
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { rows = structuredClone(DEFAULT_ROWS); return; }
    const data = JSON.parse(raw);
    rows = Array.isArray(data.rows) && data.rows.length ? data.rows : structuredClone(DEFAULT_ROWS);
    if (data.kkm !== undefined) kkmInput.value = data.kkm;
    if (data.theme === 'dark' || data.theme === 'light') document.documentElement.dataset.theme = data.theme;
  } catch (_) {
    rows = structuredClone(DEFAULT_ROWS);
  }
}

/* ---------- Actions ---------- */
document.getElementById('addRow').addEventListener('click', () => {
  rows.push({ nama: '', tugas: '', uts: '', uas: '', praktik: '', ...DEFAULT_BOBOT });
  persist(); render();
  const last = tbody.querySelector('tr:last-child .name input');
  if (last) last.focus({ preventScroll: false });
});

document.getElementById('resetAll').addEventListener('click', () => {
  if (!confirm('Hapus semua isi dan mulai dari contoh awal?')) return;
  localStorage.removeItem(STORAGE_KEY);
  kkmInput.value = '75';
  rows = structuredClone(DEFAULT_ROWS);
  render();
});

document.getElementById('exportCsv').addEventListener('click', () => {
  const kkm = clamp(num(kkmInput.value) ?? 75, 0, 100);
  const header = ['No','Mata Pelajaran','Tugas','UTS','UAS','Praktik','Bobot Tugas %','Bobot UTS %','Bobot UAS %','Bobot Praktik %','Total Bobot %','Nilai Akhir','Predikat','Status KKM (' + kkm + ')'];
  const lines = [header.map(escapeCsv).join(';')];
  rows.forEach((r, i) => {
    const { nilai, totalBobot } = hitungNilaiAkhir(r);
    const pred = predikat(nilai);
    const status = nilai === null ? '' : (nilai >= kkm ? 'Lulus' : 'Remedial');
    lines.push([
      i + 1, escapeCsv(r.nama), r.tugas, r.uts, r.uas, r.praktik,
      r.bobotTugas, r.bobotUTS, r.bobotUAS, r.bobotPraktik,
      totalBobot, nilai === null ? '' : nilai.toFixed(2), nilai === null ? '' : pred, status,
    ].join(';'));
  });
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: 'nilai-akhir-smk.csv' });
  document.body.append(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

kkmInput.addEventListener('input', onRowChange);

toggleBobotBtn.addEventListener('click', () => {
  const hidden = gradeTable.classList.toggle('hide-weights');
  toggleBobotBtn.setAttribute('aria-expanded', String(!hidden));
  toggleBobotBtn.textContent = hidden ? '⚖️ Atur bobot' : '⚖️ Sembunyikan bobot';
});

const iconMoon = document.getElementById('iconMoon');
const iconSun = document.getElementById('iconSun');
function syncThemeIcon() {
  const dark = document.documentElement.dataset.theme === 'dark';
  iconMoon.style.display = dark ? 'none' : 'block';
  iconSun.style.display = dark ? 'block' : 'none';
}
toggleThemeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  syncThemeIcon();
  persist();
});

/* ---------- Init ---------- */
restore();
syncThemeIcon();
render();
