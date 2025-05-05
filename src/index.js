require('dotenv').config();
const express = require('express');
const helmet = require('helmet'); // Import helmet
const db       = require('./db');
const tilesR   = require('./routes/tiles');
const pieR     = require('./routes/pie');
const chartR   = require('./routes/chart');
const energyR  = require('./routes/energy'); // Import energy route
const path     = require('path');
const { askOpenAI } = require('./eco-home-hub/ai-agent'); // Import askOpenAI from ai-agent

// Replace static import with dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const app = express();

// Configure Helmet with adjusted CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(), // Start with defaults
        "script-src": ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"], // Allow self, tailwind CDN, and inline scripts
        "script-src-attr": ["'unsafe-inline'"], // Needed for inline event handlers if any (though maybe not strictly required here)
        "style-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"], // Allow self, font awesome, google fonts, inline styles
        "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"], // Allow self, font awesome, google fonts, AND data: URIs
        "connect-src": ["'self'"], // Allow connections to self (e.g., API calls)
        "img-src": ["'self'", "data:"], // Allow self and data URIs for images
      },
    },
  })
);

app.use(express.json({ limit: '10mb' })); // Increase JSON body size limit
app.use(express.static(__dirname + '/public'));

// podpięcie route’ów pod /api
app.use('/api/tiles', tilesR);
app.use('/api/pie',   pieR);
app.use('/api/chart', chartR);
app.use('/api/energy-data', energyR); // Register energy route

// Admin panel static route
app.use('/admin', express.static(path.join(__dirname, 'public-admin')));

// EcoHome Hub static route
app.use('/eco-home', express.static(path.join(__dirname, 'eco-home-hub')));

// OpenAI proxy endpoint
app.post('/api/openai', async (req, res) => {
  const { prompt, context, history } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
  // Default context if not provided
  const defaultContext = { solar: 4.7, grid: -0.5, battery: -2.0, batterySoc: 75, evCharge: 1.5, home: 3.2 };
  try {
    const reply = await askOpenAI({
      prompt,
      context: context || defaultContext,
      history, // Pass chat history to OpenAI
      req
    });
    res.json({ reply });
  } catch (err) {
    console.error('AI Agent error:', err);
    res.status(500).json({ error: err.message });
  }
});

// start
const PORT = 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
