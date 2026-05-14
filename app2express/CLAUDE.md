# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Express 5 Books CRUD API — a student lab project for the "Web Programming" course at KDPU (Криворізький державний педагогічний університет), group I-22. All UI strings, comments, and console messages are in **Ukrainian** — maintain this convention.

## Commands

```bash
npm start       # Start server on port 3000
node server.js  # Same, directly
```

No test runner, linter, or build step. Test endpoints manually with curl:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/books
curl -X POST -H "Content-Type: application/json" -d '{"title":"Назва","author":"Автор"}' http://localhost:3000/api/books
curl -X DELETE http://localhost:3000/api/books/1
```

## Architecture

Single-file Express 5 server (`server.js`) with a static frontend (`public/`).

**server.js** — all backend logic in one file:
- CORS middleware (wildcard origin, allows GET/POST/DELETE/OPTIONS)
- Request logging middleware (ISO timestamp + method + URL)
- JSON body parser via `express.json()`
- Static file serving from `public/`
- Four API routes (see below)

**public/** — vanilla HTML/CSS/JS frontend:
- `index.html` — book library UI (lang="uk")
- `client.js` — fetch API calls, DOM rendering, status messages
- `styles.css` — minimal styling

**books.json** — data file. Loaded synchronously on startup via `fs.readFileSync`. Every mutation (POST/DELETE) writes the entire array back to disk via `fs.writeFileSync`.

### API Endpoints

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/health` | GET | Returns `{success: true, message, timestamp}` |
| `/api/books` | GET | Returns full books array |
| `/api/books` | POST | Adds book (auto-assigns id = array length + 1), persists to `books.json` |
| `/api/books/:id` | DELETE | Removes book by id, persists to `books.json` |

## Key Conventions & Gotchas

- **Data persistence**: Unlike app1 (in-memory only), this server writes to `books.json` on every POST and DELETE. Data survives restarts.
- **ID assignment**: POST handler sets `newBook.id = books.length + 1`, which can produce duplicate IDs after deletions (e.g., if book with last ID is deleted, next add reuses that ID).
- **`books.json` must be valid JSON** — the server crashes at startup with `JSON.parse` failure if the file is corrupt.
- **No input validation** on POST body — Express 5's `express.json()` will 400 on malformed JSON, but there's no check for required fields beyond the client-side check in `client.js`.
- **No PUT/PATCH endpoint** — the modification plan is documented in the comment block at the top of `server.js` (in Ukrainian).
- **Status messages** auto-clear after 10 seconds on the frontend (`setTimeout` in `showStatus`).
- **Delete buttons** use inline `onclick="deleteBook(${book.id})"` — XSS risk if book titles/authors contain quotes.