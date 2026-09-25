# Physio Desk Frontend

Next.js dashboard for the Physio Desk clinic workspace. Browser calls use same-origin `/api/v1` routes. Those routes forward authentication and requests to FastAPI using the server-only `BACKEND_API_URL`, so the dashboard does not maintain a separate in-memory data store.

## Local development

Start the backend on port 8000, then:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000` and sign in with `admin` / `admin123` or `staff` / `staff123`.

`NEXT_PUBLIC_API_URL` should remain `/api/v1` for browser requests. `BACKEND_API_URL` is read only by Next.js route handlers and should point to `http://localhost:8000/api/v1` locally or `http://backend:8000/api/v1` in Docker Compose.

## Checks

```powershell
npm run lint
npm run build
```

The production image is built by the root `docker-compose.yml`; run the full stack with `docker compose up --build` from the repository root.