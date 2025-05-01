# Stats API PoC

A simple Node.js/Express backend with SQLite and a static frontend for displaying statistics, charts, and tiles.

- REST API for tiles, pie, and chart data
- SQLite database (file: `data.db`)
- Static frontend (HTML/JS) with Chart.js visualizations

## Quick Start

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the server:**
   ```sh
   npm start
   ```
   The API and frontend will be available at [http://localhost:3000](http://localhost:3000)

3. **(Optional) Inspect or modify the database:**
   - The database is auto-seeded on first run.
   - You can use `sqlite3 data.db` to inspect or modify data.

## Deployment

See [docs/user-guide.md](docs/user-guide.md) for deployment instructions (e.g. on fly.io).

## Documentation

- [API Reference](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Backend Functions](docs/functions.md)

## Project Structure

```
data.db
Dockerfile
fly.toml
package.json
README.md
stats-backend.code-workspace
docs/
    api.md
    functions.md
    index.md
    user-guide.md
src/
    db.js
    index.js
    public/
        app.js
        index.html
    public-admin/
        admin.js
        index.html
    routes/
        chart.js
        pie.js
        tiles.js
```

---

For full documentation, see the [docs/](docs/) directory.
