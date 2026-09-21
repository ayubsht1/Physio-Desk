# Physio Desk

Physio Desk is a physiotherapy practice management application. The project currently includes a Next.js frontend, a FastAPI backend, and PostgreSQL for local development.

## Project Structure

```text
.
├── docker-compose.yml             # Local PostgreSQL service
├── physiodesk-backend/            # FastAPI API
│   ├── app/
│   │   ├── api/v1/                # Versioned API routes
│   │   ├── core/                  # Configuration, database, and security
│   │   ├── models/                # SQLAlchemy models
│   │   └── schemas/               # Request and response schemas
│   └── requirements.txt
└── physiodesk-frontend/           # Next.js web application
    ├── src/app/
    └── package.json
```

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- npm
- Docker Desktop with Docker Compose

## Getting Started

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

PostgreSQL is exposed on `localhost:5432` with these development credentials:

| Setting | Value |
| --- | --- |
| Database | `physio_desk` |
| User | `physio` |
| Password | `physio` |
| Host | `localhost` |
| Port | `5432` |

### 2. Run the backend

Create and activate a virtual environment, then install the Python dependencies:

```bash
cd physiodesk-backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
# source .venv/bin/activate

python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

Optional backend environment variables can be placed in `physiodesk-backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://physio:physio@localhost:5432/physio_desk
CORS_ORIGINS=http://localhost:3000
```

### 3. Run the frontend

In a second terminal:

```bash
cd physiodesk-frontend
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

## API

The backend currently exposes health checks:

- `GET /health`
- `GET /api/v1/health`

Both return:

```json
{"status":"ok"}
```

Interactive API documentation is available at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Useful Commands

### Frontend

```bash
cd physiodesk-frontend
npm run dev       # Start development server
npm run lint      # Run ESLint
npm run build     # Create production build
npm run start     # Serve production build
```

### Backend and database

```bash
cd physiodesk-backend
python -m uvicorn app.main:app --reload

# From the repository root
docker compose ps
docker compose logs -f postgres
docker compose down
```

## Development Notes

- The backend loads configuration from environment variables and `physiodesk-backend/.env`.
- The PostgreSQL data is persisted in the `physio-desk-data` Docker volume.
- Do not commit local `.env` files or virtual environments.
