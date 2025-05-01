const express = require('express');
const db       = require('./db');
const tilesR   = require('./routes/tiles');
const pieR     = require('./routes/pie');
const chartR   = require('./routes/chart');
const path     = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// podpięcie route’ów pod /api
app.use('/api/tiles', tilesR);
app.use('/api/pie',   pieR);
app.use('/api/chart', chartR);

// Admin panel static route
app.use('/admin', express.static(path.join(__dirname, 'public-admin')));

// start
const PORT = 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
