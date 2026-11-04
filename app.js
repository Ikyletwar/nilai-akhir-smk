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
const avgFinal = document.getElementById('avgFinal');
const avgPredikat = document.getElementById('avgPredikat');
const avgStatus = document.getElementById('avgStatus');
const toggleThemeBtn = document.getElementById('toggleTheme');

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
  const parts = [
    [tugas, bt], [uts, bu], [uas, ba], [praktik, bp],
  ];
  let sum = 0, weightUsed = 0;
  for (const [v, w] of parts) {
    if (v !== null && w > 0) { sum += v * w; weightUsed += w; }
  }
  if (weightUsed === 0) return { nilai: null, totalBobot, valid: true };
  // Normalisasi jika ada komponen kosong: hitung dari bobot yang terisi.
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

    tr.append(el('td', {}, String(i + 1)));

    const namaTd = el('td', { class: 'name' });
    namaTd.append(el('input', {
      type: 'text', value: r.nama, placeholder: 'Nama mata pelajaran',
      'aria-label': 'Nama mata pelajaran baris ' + (i + 1),
      oninput: (e) => { rows[i].nama = e.target.value; persist(); },
    }));
    tr.append(namaTd);

    const mkNumCell = (field, label, min, max) => {
      const td = el('td');
      const inp = el('input', {
        type: 'number', min: String(min), max: String(max), step: '0.5',
        value: r[field], inputmode: 'decimal', 'aria-label': label + ' baris ' + (i + 1),
        oninput: (e) => { rows[i][field] = e.target.value; onRowChange(); },
      });
      const v = num(r[field]);
      if (v !== null && (v < min || v > max)) inp.classList.add('invalid');
      td.append(inp);
      return td;
    };
    tr.append(mkNumCell('tugas', 'Nilai tugas', 0, 100));
    tr.append(mkNumCell('uts', 'Nilai UTS', 0, 100));
    tr.append(mkNumCell('uas', 'Nilai UAS', 0, 100));
    tr.append(mkNumCell('praktik', 'Nilai praktik', 0, 100));
    tr.append(mkNumCell('bobotTugas', 'Bobot tugas (%)', 0, 100));
    tr.append(mkNumCell('bobotUTS', 'Bobot UTS (%)', 0, 100));
    tr.append(mkNumCell('bobotUAS', 'Bobot UAS (%)', 0, 100));
    tr.append(mkNumCell('bobotPraktik', 'Bobot praktik (%)', 0, 100));

    tr.append(el('td', { class: totalBobot === 100 ? 'sum-ok' : 'sum-bad' }, totalBobot + '%'));
    tr.append(el('td', { class: 'final-cell' }, nilai === null ? '–' : nilai.toFixed(2)));

    const predTd = el('td');
    predTd.append(nilai === null
      ? document.createTextNode('–')
      : el('span', { class: 'badge badge-' + pred }, pred));
    tr.append(predTd);

    const statusTd = el('td', { class: nilai === null ? '' : (lulus ? 'status-pass' : 'status-fail') },
      nilai === null ? '–' : (lulus ? 'Lulus' : 'Remedial'));
    tr.append(statusTd);

    const delTd = el('td');
    delTd.append(el('button', {
      type: 'button', class: 'row-delete', title: 'Hapus baris', 'aria-label': 'Hapus baris ' + (i + 1),
      onclick: () => { rows.splice(i, 1); persist(); render(); },
    }, '✕'));
    tr.append(delTd);

    tbody.append(tr);
  });

  if (anyInvalid) {
    globalWarning.hidden = false;
    globalWarning.textContent = 'Ada baris dengan total bobot ≠ 100%. Nilai akhir baris tersebut tidak dihitung.';
  } else {
    globalWarning.hidden = true;
  }

  const avg = countFinal ? sumFinal / countFinal : null;
  avgFinal.textContent = avg === null ? '–' : avg.toFixed(2);
  avgPredikat.textContent = predikat(avg);
  avgStatus.textContent = avg === null ? '–' : (avg >= kkm ? 'Lulus' : 'Remedial');
  avgStatus.className = 'tfoot-value ' + (avg === null ? '' : (avg >= kkm ? 'status-pass' : 'status-fail'));
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
  if (last) last.focus();
});

document.getElementById('resetAll').addEventListener('click', () => {
  if (!confirm('Hapus semua data dan kembalikan ke contoh awal?')) return;
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

toggleThemeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  toggleThemeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
  persist();
});

/* ---------- Init ---------- */
restore();
toggleThemeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
render();
