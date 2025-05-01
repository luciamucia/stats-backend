# Copilot Guidelines

## General
- Use clear, descriptive names (English).
- Write concise comments for non-obvious logic.
- Keep code modular and reusable.

## Project Structure
- Backend: `src/`
- API routes: `src/routes/`
- DB logic: `src/db.js`
- Static assets: `src/public/`, `src/public-admin/`

## API & DB
- Use Express.js for endpoints.
- Validate input, return proper status codes.
- Parse/stringify JSON fields as needed.
- Use parameterized queries for DB.
- Handle DB errors and return clear responses.

## Code Style
- 2-space indentation.
- Prefer `const`/`let` over `var`.
- Use arrow functions for callbacks.
- Always handle async errors.

## Docs & Version Control
- Update `docs/` for new APIs/features.
- Write clear commit messages.

---

Keep this file updated as the project evolves.
