# User Guide

## Local Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   npm start
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000)

## Deployment (e.g. fly.io)

1. Build the Docker image:
   ```sh
   docker build -t stats-backend .
   ```
2. Deploy to your chosen platform (e.g. fly.io):
   - Configure `fly.toml`
   - Use `flyctl launch` and `flyctl deploy`

## Working with the Database

- The database is the `data.db` file (SQLite)
- You can use `sqlite3 data.db` to inspect or modify data

## Frontend

- Static frontend files are located in `src/public/` and `src/public-admin/`
- Charts are generated using Chart.js

## Further Documentation

- [API Reference](api.md)
- [Backend Functions](functions.md)
