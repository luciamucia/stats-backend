# Backend Functions Description

## Structure

- `src/index.js` – main file launching Express and loading routes
- `src/db.js` – SQLite database initialization and seeding
- `src/routes/tiles.js` – `/tiles` endpoint
- `src/routes/pie.js` – `/pie` endpoint
- `src/routes/chart.js` – `/chart` endpoint

## Main Functions

- **Database initialization**: automatic creation and seeding of the database on first run
- **Serving static frontend**: files from `src/public/` and `src/public-admin/`
- **REST API**: handling GET requests for `/tiles`, `/pie`, `/chart`

## Example Request Flow

1. The client sends a GET request to `/tiles`
2. Express forwards the request to the router in `routes/tiles.js`
3. The router fetches data from the database via `db.js` and returns JSON

## Further Documentation

- [User Guide](user-guide.md)
- [API Reference](api.md)
