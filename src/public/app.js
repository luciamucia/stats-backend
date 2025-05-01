// --- Tiles z obsługą sekcji i sortowania ---
const DEFAULT_SECTION = 'main';

function renderSectionSelector(tiles) {
  // Usunięto select sekcji, nie renderujemy już combo
  const container = document.getElementById('tiles-section-selector');
  container.innerHTML = '';
}

function showTiles(tiles) {
  const el = document.getElementById('tiles');
  // Grupuj po section
  const grouped = {};
  for (const t of tiles) {
    const section = t.section || 'default';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(t);
  }
  // Sortuj sekcje alfabetycznie, a w sekcji po idx
  const sections = Object.keys(grouped).sort();
  el.innerHTML = sections.map(section => {
    const sorted = grouped[section].sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
    return `
      <div style="margin-bottom:2em;">
        <h3 style="text-align:center;max-width:900px;margin:0 auto 0.5em auto;">Section: ${section !== 'default' ? section : ''}</h3>
        <div class=\"tiles-grid\">` +
      sorted.map(t => {
        if (t.value && typeof t.value === 'object' && !Array.isArray(t.value)) {
          const values = Object.entries(t.value)
            .map(([k, v]) => `<div class=\"tile-value\">${k}: ${v}</div>`)
            .join('');
          return `<div class=\"tile\"><div class=\"tile-title\">${t.title}</div>${values}</div>`;
        } else {
          return `<div class=\"tile\"><div class=\"tile-title\">${t.title}</div><div class=\"tile-value\">${t.value}</div></div>`;
        }
      }).join('') +
      `</div></div>`;
  }).join('');
}

async function fetchAndShowTiles() {
  const res = await fetch('/api/tiles');
  const tiles = await res.json();
  renderSectionSelector(tiles);
  showTiles(tiles, DEFAULT_SECTION);
}

// Dyskretne odświeżanie tiles
let lastTiles = null;
async function fetchAndShowTilesSmart() {
  const res = await fetch('/api/tiles');
  const tiles = await res.json();
  if (JSON.stringify(tiles) !== JSON.stringify(lastTiles)) {
    renderSectionSelector(tiles);
    showTiles(tiles);
    lastTiles = tiles;
  }
}

// Dyskretne odświeżanie pie
let lastPie = null;
async function fetchAndShowPieSmart() {
  const res = await fetch('/api/pie');
  const pie = await res.json();
  if (JSON.stringify(pie) !== JSON.stringify(lastPie)) {
    const el = document.getElementById('pie');
    el.innerHTML = pie.length
      ? '<pre>' + pie.map(p => `${p.category}: ${p.amount} (${p.percent}%)`).join('\n') + '</pre>'
      : '<em>No data</em>';
    lastPie = pie;
  }
}

// --- Chart.js: wyświetlanie wszystkich wykresów jako sekcje z wykresami liniowymi ---
const chartColors = [
  '#0074d9', '#ff4136', '#2ecc40', '#ff851b', '#b10dc9', '#ffdc00', '#001f3f', '#39cccc', '#01ff70', '#85144b', '#f012be', '#3d9970', '#111111', '#aaaaaa'
];

// Przechowuj instancje Chart.js i ostatnie dane
let allChartsInstances = {};
let allChartsLastData = {};

async function renderAllChartsLineChartsSmart() {
  const res = await fetch('/api/chart');
  const types = await res.json();
  const chartContainer = document.getElementById('allChartsView');
  // Tworzymy grid na 2 kolumny jeśli nie istnieje
  let grid = chartContainer.querySelector('.charts-grid');
  if (!grid) {
    chartContainer.innerHTML = '';
    grid = document.createElement('div');
    grid.className = 'charts-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '2em';
    chartContainer.appendChild(grid);
  }

  // Usuwamy wykresy, które już nie istnieją
  for (const type in allChartsInstances) {
    if (!types.includes(type)) {
      if (allChartsInstances[type]) allChartsInstances[type].destroy();
      delete allChartsInstances[type];
      delete allChartsLastData[type];
      const section = grid.querySelector(`[data-type="${type}"]`);
      if (section) section.remove();
    }
  }

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const r = await fetch(`/api/chart/${type}`);
    const data = await r.json();
    const color = chartColors[i % chartColors.length];
    const labels = data.map(d => d.timestamp.slice(0, 7).replace('-0', '-').replace('-',' '));
    const values = data.map(d => d.value);
    const dataKey = JSON.stringify({ labels, values });

    // Szukamy sekcji/canvas dla tego typu
    let section = grid.querySelector(`[data-type="${type}"]`);
    let canvas;
    if (!section) {
      section = document.createElement('div');
      section.dataset.type = type;
      section.style.marginBottom = '2em';
      section.innerHTML = `<div class='chart-section-title'>${type}</div>`;
      canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      canvas.style.background = '#f4f4f4';
      canvas.style.borderRadius = '10px';
      canvas.style.boxShadow = '0 2px 8px #0001';
      section.appendChild(canvas);
      grid.appendChild(section);
    } else {
      canvas = section.querySelector('canvas');
    }

    // Jeśli dane się nie zmieniły, nie aktualizuj wykresu
    if (allChartsLastData[type] === dataKey) continue;
    allChartsLastData[type] = dataKey;

    // Jeśli już istnieje instancja Chart.js, zaktualizuj ją
    if (allChartsInstances[type]) {
      allChartsInstances[type].data.labels = labels;
      allChartsInstances[type].data.datasets[0].data = values;
      allChartsInstances[type].update();
    } else {
      allChartsInstances[type] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: type,
            data: values,
            borderColor: color,
            backgroundColor: color + '33',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          responsive: false,
          plugins: { legend: { display: true } },
          scales: {
            x: { title: { display: true, text: 'Miesiąc' } },
            y: { title: { display: true, text: type } }
          }
        }
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  fetchAndShowTilesSmart();
  fetchAndShowPieSmart();

  // Usuwamy select chartTypeSelector i canvas chartCanvas jeśli istnieją
  const selector = document.getElementById('chartTypeSelector');
  if (selector) selector.remove();
  const chartCanvas = document.getElementById('chartCanvas');
  if (chartCanvas) chartCanvas.remove();

  // Dodaj sekcję na wszystkie wykresy chart
  let allChartsView = document.getElementById('allChartsView');
  if (!allChartsView) {
    allChartsView = document.createElement('div');
    allChartsView.id = 'allChartsView';
    document.body.appendChild(allChartsView);
  }
  renderAllChartsLineChartsSmart();
  setInterval(renderAllChartsLineChartsSmart, 5000);
  // Dodane: cykliczne odświeżanie tiles
  setInterval(fetchAndShowTilesSmart, 5000);
});
