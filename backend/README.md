# Campus Security System — Django Backend & REST API

Pure Python & Django REST API backend for the Smart Campus Security & Asset Verification System.

---

## 🛠️ Requirements & Setup

1. **Python Environment and PostgreSQL**:
   Ensure PostgreSQL is running and the `campus_securitydb` database exists. Copy `.env.example` to `.env` and set your local password. Django and SQLAlchemy both use this connection. PostgreSQL connection failures are reported directly; SQLite is available only when `USE_SQLITE=1` is explicitly set for a local migration. Create a virtual environment inside `backend/` and install dependencies:
   In PowerShell, for example:
   ```powershell
   cd backend
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   $env:PGDATABASE = "campus_securitydb"
   $env:PGUSER = "postgres"
   $env:PGPASSWORD = "your-local-postgres-password"
   $env:PGHOST = "localhost"
   $env:PGPORT = "5432"
   ```

2. **Run Server**:
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe manage.py runserver
   ```
   The backend root (`http://127.0.0.1:8000/`) returns a JSON status response; the Django login page is available at `http://127.0.0.1:8000/login/`.

3. **Database Migrations**:
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe manage.py migrate
   ```
   Migrations now run against PostgreSQL. Existing local database records are not copied automatically.

---

## 📡 REST API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login/` | Officer terminal authentication |
| `GET`, `POST` | `/api/assets/` | List, filter, and register physical assets |
| `GET`, `PATCH` | `/api/assets/<code_or_serial>/` | Asset details and status management |
| `GET`, `POST` | `/api/owners/` | People directory and owner creation with optional `photo` and `document` multipart uploads |
| `GET` | `/api/owners/<id>/` | Owner profile, including uploaded photo and document URLs |
| `POST` | `/api/verification/verify/` | Gate code lookup and audit logging |
| `GET` | `/api/verification/history/` | Checkpoint verification logs |
| `POST` | `/api/exit-passes/` | Digital exit pass issuance |
| `GET` | `/api/reports/overview/` | Security KPI dashboard metrics |
| `GET` | `/api/notifications/` | Current user's latest system notifications |
| `PATCH` | `/api/notifications/<id>/` | Mark a notification as read |

CORS is configured to accept requests from the frontend at `http://localhost:3000`.

New administrator, asset, owner, incident, and exit-pass records generate in-app notifications for every active user. Notifications are stored separately for each recipient and appear in the notification drawer; signed-in clients check for new notifications every 10 seconds.

The Reports page and its PDF/CSV exports are generated from the current database records. The overview includes today's verification counts, current asset statuses, active security accounts, and the full asset inventory; successful-check percentages use today's successful verification logs rather than current asset totals.
