async function fetchTilesAdmin() {
  const res = await fetch('/api/tiles');
  return await res.json();
}

function renderTilesAdminList(tiles) {
  const list = document.getElementById('tilesAdminList');
  list.innerHTML = `<table><tr><th>id</th><th>title</th><th>value</th><th>section</th><th>idx</th><th></th></tr>
    ${tiles.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.title}</td>
        <td><pre>${typeof t.value === 'object' ? JSON.stringify(t.value) : t.value}</pre></td>
        <td>${t.section ?? ''}</td>
        <td>${t.idx ?? ''}</td>
        <td style="white-space:nowrap;">
          <button onclick="editTileAdmin('${t.id}')" style="margin-right:0.5em;">Edit</button><button onclick="deleteTileAdmin('${t.id}')">Delete</button>
        </td>
      </tr>`).join('')}
  </table>`;
}

async function refreshTilesAdmin() {
  const tiles = await fetchTilesAdmin();
  renderTilesAdminList(tiles);
}

window.editTileAdmin = async function(id) {
  const tiles = await fetchTilesAdmin();
  const t = tiles.find(t => t.id === id);
  if (!t) return;
  document.getElementById('tileId').value = t.id;
  document.getElementById('tileTitle').value = t.title;
  document.getElementById('tileValue').value = typeof t.value === 'object' ? JSON.stringify(t.value) : t.value;
  document.getElementById('tileSection').value = t.section ?? '';
  document.getElementById('tileIdx').value = t.idx ?? '';
  document.getElementById('tileId').disabled = true;
  document.getElementById('tileSaveBtn').textContent = 'Update';
  document.getElementById('tileCancelBtn').style.display = '';
}

window.deleteTileAdmin = async function(id) {
  if (!confirm('Delete tile ' + id + '?')) return;
  await fetch('/api/tiles/' + id, { method: 'DELETE' });
  refreshTilesAdmin();
}

document.getElementById('tileForm').onsubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('tileId').value.trim();
  const title = document.getElementById('tileTitle').value.trim();
  let value = document.getElementById('tileValue').value.trim();
  const section = document.getElementById('tileSection').value.trim();
  const idx = document.getElementById('tileIdx').value.trim();
  try { value = value ? JSON.parse(value) : ''; } catch { /* zostaw jako string */ }
  const body = { title, value, section, idx: idx ? Number(idx) : undefined };
  if (id && document.getElementById('tileId').disabled) {
    // update
    await fetch('/api/tiles/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } else {
    // create
    await fetch('/api/tiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id || title.replace(/\s+/g,'-'), ...body })
    });
  }
  this.reset();
  document.getElementById('tileId').disabled = false;
  document.getElementById('tileSaveBtn').textContent = 'Save';
  document.getElementById('tileCancelBtn').style.display = 'none';
  refreshTilesAdmin();
};

document.getElementById('tileCancelBtn').onclick = function() {
  document.getElementById('tileForm').reset();
  document.getElementById('tileId').disabled = false;
  document.getElementById('tileSaveBtn').textContent = 'Save';
  this.style.display = 'none';
};

window.addEventListener('DOMContentLoaded', refreshTilesAdmin);

// --- Chart Admin CRUD ---
let chartTypeFilter = '';

async function fetchChartAdmin() {
  const res = await fetch('/api/chart');
  const types = await res.json();
  let all = [];
  for (const type of types) {
    const r = await fetch(`/api/chart/${type}`);
    const data = await r.json();
    all = all.concat(data.map(d => ({ type, ...d })));
  }
  // Sort by type, then timestamp
  all.sort((a, b) => a.type.localeCompare(b.type) || a.timestamp.localeCompare(b.timestamp));
  return all;
}

async function fetchChartTypes() {
  const res = await fetch('/api/chart');
  return await res.json();
}

function renderChartTypeFilter(types) {
  let filter = document.getElementById('chartTypeFilter');
  let label = document.getElementById('chartTypeFilterLabel');
  if (!label) {
    label = document.createElement('label');
    label.id = 'chartTypeFilterLabel';
    label.textContent = 'Filter chart data: ';
    label.style.display = 'block';
    label.style.textAlign = 'center';
    label.style.fontWeight = 'bold';
    label.style.margin = '1em 0 0.2em 0';
  }
  if (!filter) {
    filter = document.createElement('select');
    filter.id = 'chartTypeFilter';
    filter.style.marginBottom = '1em';
    filter.style.display = 'inline-block';
    filter.innerHTML = '<option value="">(all types)</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
    filter.onchange = () => {
      chartTypeFilter = filter.value;
      refreshChartAdmin();
    };
    const container = document.getElementById('chartAdminList');
    // Wycentrowanie
    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';
    wrapper.appendChild(label);
    wrapper.appendChild(filter);
    container.parentNode.insertBefore(wrapper, container);
  } else {
    filter.innerHTML = '<option value="">(all types)</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
    filter.value = chartTypeFilter;
  }
}

function renderChartAdminList(entries) {
  const list = document.getElementById('chartAdminList');
  // Filtrowanie po type
  const filtered = chartTypeFilter ? entries.filter(e => e.type === chartTypeFilter) : entries;
  list.innerHTML = `<table><tr><th>type</th><th>timestamp</th><th>value</th><th></th></tr>
    ${filtered.map(e => `
      <tr data-type="${e.type}" data-timestamp="${e.timestamp}">
        <td>${e.type}</td>
        <td>${e.timestamp}</td>
        <td class="value-cell">${e.value}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </td>
      </tr>`).join('')}
  </table>`;

  // Obsługa edycji inline
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = function() {
      const tr = btn.closest('tr');
      const type = tr.getAttribute('data-type');
      const timestamp = tr.getAttribute('data-timestamp');
      const valueCell = tr.querySelector('.value-cell');
      const oldValue = valueCell.textContent;
      valueCell.innerHTML = `<input type='number' style='width:90px' value='${oldValue}'>`;
      btn.style.display = 'none';
      const delBtn = tr.querySelector('.delete-btn');
      delBtn.style.display = 'none';
      // Dodaj Save/Cancel
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      btn.parentNode.appendChild(saveBtn);
      btn.parentNode.appendChild(cancelBtn);
      saveBtn.onclick = async function() {
        const newValue = Number(valueCell.querySelector('input').value);
        await fetch(`/api/chart/${type}/${encodeURIComponent(timestamp)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: newValue })
        });
        refreshChartAdmin();
      };
      cancelBtn.onclick = function() {
        valueCell.textContent = oldValue;
        saveBtn.remove();
        cancelBtn.remove();
        btn.style.display = '';
        delBtn.style.display = '';
      };
    };
  });
  // Obsługa usuwania
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const tr = btn.closest('tr');
      const type = tr.getAttribute('data-type');
      const timestamp = tr.getAttribute('data-timestamp');
      if (!confirm(`Delete chart entry ${type} ${timestamp}?`)) return;
      await fetch(`/api/chart/${type}/${encodeURIComponent(timestamp)}`, { method: 'DELETE' });
      refreshChartAdmin();
    };
  });
}

async function refreshChartAdmin() {
  const [types, entries] = await Promise.all([
    fetchChartTypes(),
    fetchChartAdmin()
  ]);
  renderChartTypeFilter(types);
  renderChartAdminList(entries);
}

window.addEventListener('DOMContentLoaded', refreshChartAdmin);