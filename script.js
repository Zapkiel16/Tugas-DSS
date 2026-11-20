const $ = (id) => document.getElementById(id);

let criteria = [];
let alternatives = [];

const sampleCriteria = () => [
  { name: 'Harga', type: 'cost', weight: 30 },
  { name: 'Performa', type: 'benefit', weight: 35 },
  { name: 'Baterai (jam)', type: 'benefit', weight: 20 },
  { name: 'Layar (skor)', type: 'benefit', weight: 15 }
];
const sampleAlternatives = () => [
  { name: 'Laptop A', values: [8.5, 86, 10, 92] },
  { name: 'Laptop B', values: [7.2, 76, 13, 87] },
  { name: 'Laptop C', values: [9.1, 94, 9, 90] },
  { name: 'Laptop D', values: [6.8, 72, 14, 79] }
];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}
function fmt(value, digits = 4) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
function setError(message) {
  $('errorMessage').textContent = message;
  $('errorMessage').classList.toggle('show', Boolean(message));
}
function renderCriteria() {
  $('criteriaBody').innerHTML = criteria.map((c, i) => `
    <tr>
      <td><input class="criteria-name" aria-label="Nama kriteria ${i+1}" data-kind="criterion-name" data-index="${i}" value="${escapeHTML(c.name)}" placeholder="Nama kriteria"></td>
      <td><select aria-label="Jenis kriteria ${i+1}" data-kind="criterion-type" data-index="${i}">
        <option value="benefit" ${c.type === 'benefit' ? 'selected' : ''}>Benefit</option>
        <option value="cost" ${c.type === 'cost' ? 'selected' : ''}>Cost</option>
      </select></td>
      <td><input class="weight-input" type="number" min="0" step="any" aria-label="Bobot ${i+1}" data-kind="criterion-weight" data-index="${i}" value="${c.weight}"></td>
      <td><button class="remove-btn" type="button" data-action="remove-criterion" data-index="${i}" aria-label="Hapus kriteria">×</button></td>
    </tr>`).join('');
  const total = criteria.reduce((sum, c) => sum + (num(c.weight) || 0), 0);
  $('weightTotal').textContent = fmt(total, 2);
}
function renderMatrix() {
  $('matrixHead').innerHTML = `<tr><th>Alternatif</th>${criteria.map((c,i) => `<th>${escapeHTML(c.name || `Kriteria ${i+1}`)}</th>`).join('')}<th></th></tr>`;
  $('alternativeBody').innerHTML = alternatives.map((a, i) => `
    <tr>
      <td><input aria-label="Nama alternatif ${i+1}" data-kind="alternative-name" data-index="${i}" value="${escapeHTML(a.name)}" placeholder="Nama alternatif"></td>
      ${criteria.map((c,j) => `<td><input type="number" min="0" step="any" aria-label="${escapeHTML(c.name)} untuk ${escapeHTML(a.name)}" data-kind="matrix-value" data-index="${i}" data-criterion="${j}" value="${a.values[j] ?? ''}"></td>`).join('')}
      <td><button class="remove-btn" type="button" data-action="remove-alternative" data-index="${i}" aria-label="Hapus alternatif">×</button></td>
    </tr>`).join('');
}
function renderInputs() { renderCriteria(); renderMatrix(); }

function loadSample() {
  criteria = sampleCriteria();
  alternatives = sampleAlternatives();
  renderInputs();
  setError('');
  clearResults();
}
function clearResults() {
  $('resultSummary').textContent = 'Jalankan perhitungan untuk melihat hasil.';
  $('sawResults').innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada hasil perhitungan.</td></tr>';
  $('wpResults').innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada hasil perhitungan.</td></tr>';
  $('calculationSteps').innerHTML = '<article class="panel empty-steps">Langkah perhitungan akan ditampilkan setelah tombol <strong>Hitung SAW &amp; WP</strong> ditekan.</article>';
}

document.addEventListener('input', (event) => {
  const el = event.target;
  const index = Number(el.dataset.index);
  if (el.dataset.kind === 'criterion-name') { criteria[index].name = el.value; renderMatrix(); }
  if (el.dataset.kind === 'criterion-weight') { criteria[index].weight = el.value; $('weightTotal').textContent = fmt(criteria.reduce((sum, c) => sum + (num(c.weight) || 0), 0), 2); }
  if (el.dataset.kind === 'alternative-name') alternatives[index].name = el.value;
  if (el.dataset.kind === 'matrix-value') alternatives[index].values[Number(el.dataset.criterion)] = el.value;
});
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.dataset.kind === 'criterion-type') criteria[Number(el.dataset.index)].type = el.value;
  if (el.dataset.kind === 'criterion-type') clearResults();
});
document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const index = Number(button.dataset.index);
  if (button.dataset.action === 'remove-criterion') {
    if (criteria.length <= 1) return setError('Minimal harus ada satu kriteria.');
    criteria.splice(index, 1);
    alternatives.forEach(a => a.values.splice(index, 1));
  }
  if (button.dataset.action === 'remove-alternative') {
    if (alternatives.length <= 1) return setError('Minimal harus ada satu alternatif.');
    alternatives.splice(index, 1);
  }
  setError(''); renderInputs(); clearResults();
});

$('addCriteriaBtn').addEventListener('click', () => {
  criteria.push({ name: `Kriteria ${criteria.length + 1}`, type: 'benefit', weight: 0 });
  alternatives.forEach(a => a.values.push(1));
  renderInputs(); clearResults();
});
$('addAlternativeBtn').addEventListener('click', () => {
  alternatives.push({ name: `Alternatif ${alternatives.length + 1}`, values: criteria.map(() => 1) });
  renderMatrix(); clearResults();
});
$('sampleBtn').addEventListener('click', loadSample);
$('calculateBtn').addEventListener('click', calculate);

function validate() {
  if (!criteria.length || !alternatives.length) throw new Error('Tambahkan minimal satu kriteria dan satu alternatif.');
  if (criteria.some(c => !String(c.name).trim())) throw new Error('Nama setiap kriteria wajib diisi.');
  if (alternatives.some(a => !String(a.name).trim())) throw new Error('Nama setiap alternatif wajib diisi.');
  const weights = criteria.map(c => num(c.weight));
  if (weights.some(w => !Number.isFinite(w) || w < 0)) throw new Error('Bobot harus berupa angka nol atau lebih.');
  const total = weights.reduce((a,b) => a+b, 0);
  if (total <= 0) throw new Error('Jumlah bobot harus lebih besar dari 0.');
  const matrix = alternatives.map(a => a.values.map(num));
  if (matrix.some(row => row.length !== criteria.length || row.some(v => !Number.isFinite(v) || v <= 0))) {
    throw new Error('Semua nilai matriks harus berupa angka lebih besar dari 0. Nilai 0 tidak dapat digunakan pada perhitungan WP.');
  }
  return { weights, total, matrix };
}
function makeTable(headers, rows, opts = {}) {
  const head = headers.map(h => `<th class="${opts.numeric ? 'number' : ''}">${h}</th>`).join('');
  const body = rows.map(row => `<tr>${row.map((cell, i) => `<td class="${i === 0 ? 'row-label' : (opts.numeric && i > 0 ? 'number' : '')}">${cell}</td>`).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table class="step-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function stepCard(title, description, tableHTML, note = '') {
  return `<article class="panel step-card"><div class="step-title">${title}</div><p class="step-description">${description}</p>${tableHTML}${note ? `<p class="step-note">${note}</p>` : ''}</article>`;
}
function renderRankings(targetId, ranked, method) {
  const max = Math.max(...ranked.map(x => x.score));
  $(targetId).innerHTML = ranked.map((item, i) => {
    const width = max > 0 ? (item.score / max * 100) : 0;
    return `<tr><td><span class="rank-pill ${i === 0 ? 'first' : ''}">${i+1}</span></td><td><strong>${escapeHTML(item.name)}</strong></td><td class="score-cell">${fmt(item.score)}<span class="bar-track"><span class="bar-fill" style="width:${width}%"></span></span></td><td></td></tr>`;
  }).join('');
}
function calculate() {
  try {
    setError('');
    const { weights, total, matrix } = validate();
    const normalizedWeights = weights.map(w => w / total);
    const signedWeights = normalizedWeights.map((w, i) => criteria[i].type === 'cost' ? -w : w);
    const maxValues = criteria.map((_, j) => Math.max(...matrix.map(row => row[j])));
    const minValues = criteria.map((_, j) => Math.min(...matrix.map(row => row[j])));
    const normalized = matrix.map(row => row.map((value, j) =>
      criteria[j].type === 'benefit' ? value / maxValues[j] : minValues[j] / value
    ));
    const sawScores = normalized.map(row => row.reduce((sum, value, j) => sum + value * normalizedWeights[j], 0));
    const sVector = matrix.map(row => row.reduce((product, value, j) => product * Math.pow(value, signedWeights[j]), 1));
    const sTotal = sVector.reduce((a,b) => a+b, 0);
    const vVector = sVector.map(s => s / sTotal);

    const sawRanked = alternatives.map((a,i) => ({ name: a.name, score: sawScores[i] })).sort((a,b) => b.score-a.score);
    const wpRanked = alternatives.map((a,i) => ({ name: a.name, score: vVector[i] })).sort((a,b) => b.score-a.score);
    renderRankings('sawResults', sawRanked, 'SAW');
    renderRankings('wpResults', wpRanked, 'WP');
    const sawWinner = sawRanked[0], wpWinner = wpRanked[0];
    $('resultSummary').textContent = sawWinner.name === wpWinner.name
      ? `SAW dan WP sama-sama menempatkan ${sawWinner.name} pada peringkat pertama.`
      : `SAW memilih ${sawWinner.name}, sedangkan WP memilih ${wpWinner.name} sebagai peringkat pertama.`;

    const criteriaNames = criteria.map(c => escapeHTML(c.name));
    const weightRows = criteria.map((c,j) => [
      escapeHTML(c.name), c.type === 'cost' ? 'Cost' : 'Benefit',
      fmt(weights[j], 4), fmt(normalizedWeights[j], 4), fmt(signedWeights[j], 4)
    ]);
    const weightTable = makeTable(['Kriteria','Jenis','Bobot awal','Bobot normal','Pangkat WP'], weightRows);
    const refRow = ['Minimum Cost / Maksimum Benefit', ...criteria.map((c,j) => fmt(c.type === 'cost' ? minValues[j] : maxValues[j]))];
    const normRows = alternatives.map((a,i) => [escapeHTML(a.name), ...normalized[i].map(fmt)]);
    const normTable = makeTable(['Alternatif', ...criteriaNames], [refRow, ...normRows]);
    const sawRows = alternatives.map((a,i) => [escapeHTML(a.name), ...normalized[i].map((v,j) => fmt(v * normalizedWeights[j])), fmt(sawScores[i])]);
    const sawTable = makeTable(['Alternatif', ...criteriaNames, 'Skor SAW'], sawRows);
    const wpRows = alternatives.map((a,i) => [escapeHTML(a.name), fmt(sVector[i]), fmt(vVector[i])]);
    const wpTable = makeTable(['Alternatif','Vektor S','Vektor V'], wpRows);
    $('calculationSteps').innerHTML =
      stepCard('▾ 1. Normalisasi bobot', 'Bobot normal = bobot awal ÷ jumlah seluruh bobot awal. Untuk WP, bobot kriteria Cost diberi tanda negatif.', weightTable) +
      stepCard('▾ 2. Normalisasi dan skor SAW', 'Benefit = nilai ÷ maksimum kolom. Cost = minimum kolom ÷ nilai. Skor SAW diperoleh dari jumlah normalisasi × bobot normal.', normTable,
        'Tabel berikut memperlihatkan hasil perkalian nilai normalisasi dengan bobot normal pada masing-masing kriteria.') +
      stepCard('▾ 2b. Perhitungan skor SAW', 'Jumlahkan seluruh nilai terbobot untuk mendapatkan skor akhir SAW.', sawTable) +
      stepCard('▾ 3. Vektor S dan V pada WP', 'Vektor S = hasil perkalian setiap nilai asli yang dipangkatkan dengan bobot bertanda. Vektor V = S ÷ jumlah seluruh S.', wpTable);
    $('hasil').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    setError(error.message);
    $('errorMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

loadSample();
