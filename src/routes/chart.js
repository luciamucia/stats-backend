const express = require('express');
const router  = express.Router();
const db      = require('../db');

// List all available chart types
router.get('/', (req, res) => {
  db.all('SELECT DISTINCT type FROM chart', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.type));
  });
});

router.get('/:type', (req, res) => {
  const { type } = req.params;
  db.all(
    `SELECT timestamp,value FROM chart WHERE type = ? ORDER BY timestamp`,
    [type],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// CREATE chart entry
router.post('/', (req, res) => {
  const { type, timestamp, value } = req.body;
  if (!type || !timestamp || value === undefined) return res.status(400).json({ error: 'type, timestamp, value required' });
  db.run(
    `INSERT INTO chart (type, timestamp, value) VALUES (?, ?, ?)`,
    [type, timestamp, value],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ type, timestamp, value });
    }
  );
});

// UPDATE chart entry
router.put('/:type/:timestamp', (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  db.run(
    `UPDATE chart SET value=? WHERE type=? AND timestamp=?`,
    [value, req.params.type, req.params.timestamp],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ type: req.params.type, timestamp: req.params.timestamp, value });
    }
  );
});

// DELETE chart entry
router.delete('/:type/:timestamp', (req, res) => {
  db.run(
    `DELETE FROM chart WHERE type=? AND timestamp=?`,
    [req.params.type, req.params.timestamp],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    }
  );
});

module.exports = router;
