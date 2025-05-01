// src/db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

db.serialize(() => {
  // Dodanie nowych kolumn jeśli nie istnieją
  db.run(`ALTER TABLE tiles ADD COLUMN section TEXT`, err => {});
  db.run(`ALTER TABLE tiles ADD COLUMN idx INTEGER`, err => {});

  // 1) tworzymy tabele
  db.run(`
    CREATE TABLE IF NOT EXISTS tiles (
      id TEXT PRIMARY KEY,
      title TEXT,
      value TEXT,
      section TEXT,
      idx INTEGER
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS pie (
      category TEXT,
      amount REAL,
      percent REAL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS chart (
      type TEXT,
      timestamp TEXT,
      value REAL
    );
  `);

  // 2) seedujemy tiles
  db.get(`SELECT COUNT(*) AS cnt FROM tiles`, (_, { cnt }) => {
    if (cnt === 0) {
      const insert = db.prepare(`INSERT INTO tiles (id, title, value, section, idx) VALUES (?, ?, ?, ?, ?)`);
      insert.run('marketCap', 'Market Cap', '$99,402,042', 'main', 1);
      insert.run('liquidity', 'Liquidity', '$3,836,644', 'main', 2);
      insert.run('ibcTransfers', 'IBC Transfers (24h)', '498', 'main', 3);
      insert.run('stakingApr', 'Staking APR', '4.11%', 'main', 4);
      insert.finalize();
    }
  });

  // 3) seedujemy pie
  db.get(`SELECT COUNT(*) AS cnt FROM pie`, (_, { cnt }) => {
    if (cnt === 0) {
      const insert = db.prepare(`INSERT INTO pie (category, amount, percent) VALUES (?, ?, ?)`);
      insert.run('Bonded',     518.75, 49.65);
      insert.run('Unbonded',   526.01, 50.35);
      insert.finalize();
    }
  });

  // 4) seedujemy chart — przykładowe dane dla marketCap i tvl
  db.get(`SELECT COUNT(*) AS cnt FROM chart`, (_, { cnt }) => {
    if (cnt === 0) {
      const insert = db.prepare(`INSERT INTO chart (type, timestamp, value) VALUES (?, ?, ?)`);

      // marketCap (w milionach USD)
      insert.run('marketCap', '2025-04-24T00:00:00Z', 78.3);
      insert.run('marketCap', '2025-04-25T00:00:00Z', 93.5);
      insert.run('marketCap', '2025-04-26T00:00:00Z', 95.1);
      insert.run('marketCap', '2025-04-27T00:00:00Z', 89.4);
      insert.run('marketCap', '2025-04-28T00:00:00Z', 102.2);
      insert.run('marketCap', '2025-04-29T00:00:00Z', 108.7);
      insert.run('marketCap', '2025-04-30T00:00:00Z', 100.9);

      // TVL (w milionach USD)
      insert.run('tvl',       '2025-04-24T00:00:00Z', 4.6);
      insert.run('tvl',       '2025-04-25T00:00:00Z', 4.9);
      insert.run('tvl',       '2025-04-26T00:00:00Z', 5.0);
      insert.run('tvl',       '2025-04-27T00:00:00Z', 4.8);
      insert.run('tvl',       '2025-04-28T00:00:00Z', 5.2);
      insert.run('tvl',       '2025-04-29T00:00:00Z', 5.1);
      insert.run('tvl',       '2025-04-30T00:00:00Z', 5.1);

      insert.finalize();
    }
  });

});

module.exports = db;
