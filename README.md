# Physio Desk

Physio Desk is a full-stack physiotherapy clinic workspace. The Next.js frontend uses its `/api/v1` route handlers as an authenticated server-side proxy to the FastAPI backend, which stores all operational data in PostgreSQL.

## Run everything with Docker

From the repository root:

```powershell
docker compose up --build
```

Open `http://localhost:3000`. The API is available at `http://localhost:8000/docs`.

The backend container waits for PostgreSQL, runs Alembic migrations, seeds the database once, and starts FastAPI. The frontend connects to the backend over the Compose network through `BACKEND_API_URL`; browser requests stay same-origin through Next.js.

Stop the stack with:

```powershell
docker compose down
```

Add `-v` to that command only when you want to delete the PostgreSQL volume and reseed from scratch.

## Demo accounts

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

## Local development

Use Docker for PostgreSQL, then run the applications in separate terminals:

```powershell
docker compose up -d postgres

cd physiodesk-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python create_seed_data.py
uvicorn app.main:app --reload --port 8000
```

In a second terminal:

```powershell
cd physiodesk-frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Project layout

- `physiodesk-backend`: FastAPI API, SQLAlchemy models, Alembic migrations, and seed data.
- `physiodesk-frontend`: Next.js dashboard and frontend API proxy routes.
- `docker-compose.yml`: PostgreSQL, backend, and frontend services.

## Checks

```powershell
cd physiodesk-backend
pytest -q

cd ..\physiodesk-frontend
npm run build
```