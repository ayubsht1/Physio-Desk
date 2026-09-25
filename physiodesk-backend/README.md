# Physio Desk Backend

FastAPI service for authentication, dashboard statistics, patients, appointments, therapists, services, billing, and admin users.

## Local setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a unique `JWT_SECRET_KEY` in `.env`. For local development, use the PostgreSQL service from the repository root with the default `DATABASE_URL`.

## Database and seed data

```powershell
alembic upgrade head
python create_seed_data.py
```

The seed is idempotent at the user level and includes admin/staff accounts, therapists, services, patients, appointments, and invoices.

## Run and test

```powershell
uvicorn app.main:app --reload --port 8000
pytest -q
```

API documentation is available at `http://localhost:8000/docs`.

For the complete stack, run `docker compose up --build` from the repository root.