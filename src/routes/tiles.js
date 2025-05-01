const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  db.all(`SELECT id,title,value,section,idx FROM tiles`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parsowanie value jako JSON
    const parsedRows = rows.map(row => ({
      ...row,
      value: (() => { try { return JSON.parse(row.value); } catch { return row.value; } })()
    }));
    res.json(parsedRows);
  });
});

// CREATE tile
router.post('/', (req, res) => {
  const { id, title, value, section, idx } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title are required' });
  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  db.run(
    `INSERT INTO tiles (id, title, value, section, idx) VALUES (?, ?, ?, ?, ?)`,
    [id, title, valueStr, section ?? null, idx ?? null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, title, value, section, idx });
    }
  );
});

// UPDATE tile (dynamiczny update tylko podanych pól)
router.put('/:id', (req, res) => {
  const allowed = ['title', 'value', 'section', 'idx'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      if (key === 'value' && typeof req.body.value === 'object') {
        fields.push('value=?');
        values.push(JSON.stringify(req.body.value));
      } else {
        fields.push(`${key}=?`);
        values.push(req.body[key]);
      }
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  db.run(
    `UPDATE tiles SET ${fields.join(', ')} WHERE id=?`,
    values,
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    }
  );
});

// DELETE tile
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM tiles WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });
});

module.exports = router;