# Physio Desk Backend Instructions

## Project conventions

- This is a FastAPI application using SQLAlchemy, Alembic, Pydantic v2, and PostgreSQL.
- The application entry point is `app.main:app`.
- API routes live under `/api/v1` and are grouped by feature in `app/api/v1/endpoints`.
- Keep database models in `app/models`, request and response contracts in `app/schemas`, and shared infrastructure in `app/core`.
- Use the existing synchronous SQLAlchemy session dependency unless a deliberate migration to async is requested.
- Preserve the current four-space indentation style in Python files.

## Database rules

- Schema changes must be represented by an Alembic migration in `alembic/versions`.
- Do not use `Base.metadata.create_all()` in application or seed code.
- Run `alembic upgrade head` before running `create_seed_data.py`.
- Preserve clinical, appointment, and billing history. Prefer protected deletes or status changes over cascading deletion.

## API and security rules

- Authenticated endpoints must use `get_current_user` or `require_roles`.
- Access and refresh JWTs must keep distinct token types and refresh tokens must never authenticate regular API requests.
- Never add secrets, passwords, or real patient data to source control. Use `.env` locally and update `.env.example` when configuration changes.
- Validate cross-record references and scheduling conflicts at the endpoint/service boundary before committing.
- Use Pydantic schemas for all external input and keep response models explicit.
- Return appropriate HTTP status codes: `401` for invalid authentication, `403` for insufficient role, `404` for missing records, `409` for conflicts, and `422` for invalid input.

## Validation workflow

Run these commands from the repository root after changes:

```powershell
python -m compileall -q app alembic create_seed_data.py
pytest -q
alembic current
```

For database changes, also run `alembic upgrade head` against the configured development database. Add focused tests for security, validation, migrations, and data-integrity behavior when changing those areas.