# Physio Desk

Physio Desk is a physiotherapy clinic operations demo built with a FastAPI backend and a Next.js dashboard front end. The project includes a design system-based dashboard, seeded data, role-based authentication, and the core clinic entities required by the brief.

## Assumptions

- Admin users can access billing and therapist management; staff users can read and work with patient and scheduling data but are restricted from admin-only management.
- A single therapist slot is treated as a 30/45/60-minute time block depending on the therapist schedule; double-booking is prevented at the API layer.
- Appointments created in the demo use an in-memory check against the same therapist/date/start time combination, rather than a complex recurring schedule engine.
- The frontend is an API-connected Next.js workspace that loads live dashboard data and provides patient, appointment, invoice, and admin therapist workflows.

## Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, Alembic
- Frontend: Next.js 16, React 19, TypeScript
- Auth: JWT access tokens with a role-based permission dependency
- Data: PostgreSQL with a seed script for admin/staff users, patients, therapists, appointments, and invoices

## Project structure

```text
.
├── docker-compose.yml
├── README.md
├── physiodesk-backend/
│   ├── alembic/
│   ├── app/
│   ├── .env.example
│   ├── alembic.ini
│   ├── create_seed_data.py
│   ├── requirements.txt
│   └── ...
├── physiodesk-frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── .gitignore
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop / Docker Compose
- PostgreSQL client tools are optional

## Local setup

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

Expected credentials:

- Database: physio_desk
- User: physio
- Password: physio
- Host: localhost
- Port: 5432

### 2. Backend setup

```bash
cd physiodesk-backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
# source .venv/bin/activate

python -m pip install -r requirements.txt
copy .env.example .env
```

Then initialize the database schema and seed the app:

```bash
python -m alembic upgrade head
python create_seed_data.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API is available at:

- http://localhost:8000
- http://localhost:8000/docs
- http://localhost:8000/redoc

### 3. Frontend setup

In a second terminal:

```bash
cd physiodesk-frontend
npm install
npm run dev
```

Then open:

- http://localhost:3000

## Login credentials

- Admin: admin / admin123
- Staff: staff / staff123

## API auth behavior

- Login is handled at POST /api/v1/auth/login
- The JWT access token must be sent with Authorization: Bearer <token>
- Role enforcement is applied through the backend dependency checks for admin-only routes such as therapist and billing management
- All non-login routes require an authenticated session

## Seeded data

The demo includes:

- 2 users (admin + staff)
- 10 patients
- 4 therapists
- Several appointments covering today and upcoming sessions
- Mixed paid and due invoices

## Alembic workflow

```bash
cd physiodesk-backend
python -m alembic revision --autogenerate -m "describe changes"
python -m alembic upgrade head
```

## Notes

- The design language follows the palette and type system described in the brief: Fraunces for headings, Inter for UI, IBM Plex Mono for data points.
- The dashboard follows the requested visual system and keeps the primary clinic workflows in one responsive workspace.

## What I would improve with more time

- Add patient detail views with session and billing history, plus edit/void actions for all existing records.
- Add refresh-token rotation and stronger auth session handling.
- Build richer schedule validation, availability widgets, and a real-day calendar grid.
- Add integration tests for auth, appointment booking conflict prevention, and billing logic.
- Deploy the app to a hosted environment for live reviewer access.
