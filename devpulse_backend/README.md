# DevPulse Backend

Django REST Framework backend for a website uptime monitoring and incident management SaaS. This starter implementation uses PostgreSQL, JWT authentication, Django management commands and cron. It does **not** require Redis or Celery.

## Features included

- Custom User model and JWT register/login/refresh/profile APIs
- Owner-scoped project, monitor, status-page and notification-channel APIs
- HTTP/HTTPS health checks with response-time measurement, expected status code and optional keyword checks
- Scheduled due-monitor processing using a Django management command
- Consecutive-failure incident creation and consecutive-success recovery
- Incident acknowledgement and internal notes
- Email and Discord webhook notifications with delivery logs
- Sample-based uptime and response-time analytics
- Public status-page endpoint
- Swagger/OpenAPI documentation
- Basic URL/SSRF protections and security tests

## Requirements

- Python 3.14 (the project targets Django 6.1)
- PostgreSQL 15 or newer for Django 6.1
- Git (optional)
- Postman

Django 6.1 supports Python 3.14 and requires PostgreSQL 15+ when using PostgreSQL. If you use another Python/Django combination, adjust `requirements.txt` to compatible versions.

## 1. Create the PostgreSQL database

Open pgAdmin or psql and create a database named `devpulse`:

```sql
CREATE DATABASE devpulse;
```

Use a database user that has permission to connect and create tables in this database. Put the credentials in `.env`; do not commit `.env`.

For a quick API-only trial before PostgreSQL is configured, set `DB_ENGINE=sqlite` in `.env`. PostgreSQL is the intended database for this project.

## 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
cd DevPulse\backend
py -3.14 -m venv .venv
.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt instead:

```cmd
.venv\Scripts\activate.bat
```

Linux/macOS:

```bash
cd DevPulse/backend
python3.14 -m venv .venv
source .venv/bin/activate
```

## 3. Install packages and configure environment

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and edit the values. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

At minimum, set a strong `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_HOST`. `DEBUG=True` is only for local development.

## 4. Create database tables

```bash
python manage.py makemigrations accounts projects monitors incidents notifications
python manage.py migrate
python manage.py createsuperuser
```

The `AUTH_USER_MODEL` is custom. Do not run migrations against an existing project database that was created with Django's default user model. For a fresh database, run these migrations before creating any users.

## 5. Run the API

```bash
python manage.py check
python manage.py runserver
```

Useful local URLs:

- Admin: http://127.0.0.1:8000/admin/
- OpenAPI schema: http://127.0.0.1:8000/api/schema/
- Swagger UI: http://127.0.0.1:8000/api/docs/

## 6. Start testing with Postman

Base URL: `http://127.0.0.1:8000/api`

1. `POST /auth/register/` with username, email and password.
2. `POST /auth/token/` with username and password. Copy `access` from the response.
3. For protected endpoints, use Authorization → Bearer Token and paste the access token.
4. `POST /projects/` to create a project.
5. `POST /monitors/` to add a public URL to monitor.
6. `POST /monitors/{id}/check-now/` to execute an immediate check.
7. `GET /monitors/{id}/checks/` to view recorded checks.
8. `GET /incidents/` to view incidents.

An importable Postman collection is in `postman/DevPulse.postman_collection.json`.

## API endpoint map

### Authentication

- `POST /api/auth/register/` — create account
- `POST /api/auth/token/` — obtain access and refresh tokens
- `POST /api/auth/token/refresh/` — refresh access token
- `GET/PATCH /api/auth/me/` — current user profile

### Projects

- `GET/POST /api/projects/`
- `GET/PUT/PATCH/DELETE /api/projects/{id}/`

### Monitors

- `GET/POST /api/monitors/`
- `GET/PUT/PATCH/DELETE /api/monitors/{id}/`
- `GET /api/monitors/{id}/checks/` — latest 100 checks
- `POST /api/monitors/{id}/check-now/` — run a check immediately

Monitor creation body example:

```json
{
  "project": 1,
  "name": "Example homepage",
  "url": "https://example.com",
  "check_interval": 60,
  "timeout": 10,
  "expected_status_code": 200,
  "expected_keyword": "Example Domain",
  "is_active": true
}
```

### Incidents

- `GET /api/incidents/` — optional `?status=OPEN`
- `GET /api/incidents/{id}/`
- `POST /api/incidents/{id}/acknowledge/`
- `POST /api/incidents/{id}/notes/` with `{ "message": "Investigating origin server" }`

Incidents are automatically opened after the configured number of consecutive failed checks and resolved after the configured number of consecutive successful checks. Manual resolution is intentionally omitted so a user cannot mark a still-failing service as recovered.

### Notifications

- `GET/POST /api/notification-channels/`
- `GET/PUT/PATCH/DELETE /api/notification-channels/{id}/`

Email channel example:

```json
{"project": 1, "channel_type": "EMAIL", "target": "alerts@example.com", "is_active": true}
```

Discord channel example:

```json
{"project": 1, "channel_type": "DISCORD", "target": "https://discord.com/api/webhooks/ID/TOKEN", "is_active": true}
```

### Analytics

- `GET /api/analytics/overview/` — optional `?project_id=1`
- `GET /api/analytics/monitors/{id}/?period=24h|7d|30d`

Uptime is a sample-based estimate: successful checks divided by all recorded checks in the selected period. It is not exact continuous uptime; missed checks and interval gaps are not interpolated.

### Status pages

- `GET/POST /api/status-pages/`
- `GET/PUT/PATCH/DELETE /api/status-pages/{id}/`
- `GET /api/public/status/{slug}/` — public, no JWT required

Status page creation body example:

```json
{"project": 1, "title": "Example Service Status", "slug": "example-status", "is_public": true}
```

## 7. Schedule periodic monitoring

The monitoring command processes monitors whose `next_check_at` is due:

```bash
python manage.py run_monitor
```

Test the command manually first. Then schedule it once per minute using cron on Linux:

```cron
* * * * * cd /absolute/path/to/DevPulse/backend && /absolute/path/to/DevPulse/backend/.venv/bin/python manage.py run_monitor >> /absolute/path/to/DevPulse/backend/monitor.log 2>&1
```

On Windows, use Task Scheduler to run `python.exe` with argument `manage.py run_monitor` and the backend folder as the working directory, repeating every minute. The command has a database lease to reduce duplicate work if invocations overlap. For bigger installations, move to a dedicated worker/queue and multiple monitoring regions.

## Authentication package compatibility note

The requirements pin `djangorestframework-simplejwt==5.5.1`. Its published compatibility documentation lists older Django versions as its officially tested matrix, while this starter targets Django 6.1. The integration is intentionally kept behind the standard DRF authentication setting, but verify login, refresh and protected endpoints in your environment. If SimpleJWT raises a compatibility error, use a Django version listed by its compatibility documentation or swap to a JWT package that explicitly supports your Django release.

## Important security and operational notes

1. The URL validator permits only HTTP/HTTPS on standard ports and rejects hostnames/IPs that resolve to non-public addresses. It disables redirects. This is a baseline SSRF defense, not a complete boundary against DNS rebinding or infrastructure-level routing mistakes. In production, enforce outbound firewall/egress rules that block private, loopback, link-local and cloud metadata networks.
2. Do not expose the Django development server to the public internet. Use a production WSGI/ASGI server, HTTPS, secure settings, secrets management and firewall rules.
3. Notification delivery runs synchronously after the incident transaction commits. A slow SMTP/Discord provider can delay that process; a queue is the natural later upgrade when infrastructure allows it.
4. Check history grows continuously. Add retention/partitioning before operating at significant volume.
5. The first version is single-owner per project. Team collaboration, billing, plan limits, multi-region checks, maintenance windows and richer SLA calculations are future extensions.
6. Never put actual email passwords, webhook tokens, or Django secret keys in Git.

## Run tests

```bash
python manage.py test apps.monitors apps.incidents
```

The included tests cover basic unsafe-target rejection. Add integration tests for registration, object ownership, incident transitions, email delivery and public status page behavior as the application grows.
