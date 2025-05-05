// Route to serve HEMS simulator results as JSON
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Path to the HEMS simulator JSON file
const hemsFilePath = path.join(__dirname, '../hems-simulator/data/hems_results_2025-05-04_10:43:28.json');

router.get('/energy-data', (req, res) => {
  fs.readFile(hemsFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read HEMS data' });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData.results || []);
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse HEMS data' });
    }
  });
});

module.exports = router;
