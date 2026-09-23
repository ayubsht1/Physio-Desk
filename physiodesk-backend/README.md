# Physio Desk Backend

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a unique `JWT_SECRET_KEY` and a reachable PostgreSQL `DATABASE_URL` in `.env`.

## Database

Run migrations before seeding data:

```powershell
alembic upgrade head
python create_seed_data.py
```

The seed script expects the schema to already exist and is idempotent when users are present.

## Run

```powershell
uvicorn app.main:app --reload
```

API documentation is available at `http://127.0.0.1:8000/docs`.

## Tests

```powershell
pytest -q
```