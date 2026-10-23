# De Paul School application

The repository is organized into two applications:

- `frontend/` — Next.js visitor website and administrator interface.
- `backend/` — Express API backed by Supabase Postgres and Storage.

Run the frontend with `npm run frontend:dev` and the backend with `npm run backend:dev`. Configure each application's environment file separately. The Next.js API routes remain under `frontend/src/app/api` only during the staged migration; new and migrated API code belongs in `backend/src`.
