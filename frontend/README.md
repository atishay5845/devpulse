# DevPulse Frontend

A responsive React + Vite + Tailwind CSS frontend for the DevPulse Django REST Framework backend.

## Included screens

- Public marketing landing page
- Login and registration (JWT)
- Overview dashboard
- Projects CRUD
- Monitors CRUD, pause/resume, manual check, check history and analytics detail
- Incident list, acknowledge action, event timeline and investigation notes
- Email and Discord notification channel management and delivery logs
- Analytics overview and monitor-level response/uptime metrics
- Public status page management and public status page route
- Profile settings

## Backend compatibility

This UI is wired to the routes and serializer fields in the DevPulse backend starter:

- `POST /api/auth/register/`
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `GET/PATCH /api/auth/me/`
- `/api/projects/`
- `/api/monitors/`, `/api/monitors/{id}/checks/`, `/api/monitors/{id}/check-now/`
- `/api/incidents/`, `/api/incidents/{id}/acknowledge/`, `/api/incidents/{id}/notes/`
- `/api/notification-channels/`, `/api/notification-logs/`
- `/api/analytics/overview/`, `/api/analytics/monitors/{id}/`
- `/api/status-pages/`, `/api/public/status/{slug}/`

The list helper understands DRF's paginated `{ count, next, previous, results }` format. The UI does not invent a response-time property on the monitor list; response time is read from stored monitor checks.

## Requirements

- Node.js 20.19+ or 22.12+
- The DevPulse Django backend running locally

## Setup

1. Extract this folder next to your backend folder (the parent folder may be named `DevPulse`).
2. Open a terminal in `frontend/`.
3. Install packages:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`:

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

5. Confirm `.env` contains the correct Django API base URL:

   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

6. Start the frontend:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:5173` for the public landing page. Sign in or create an account to enter the workspace at `/dashboard`.

## Start both apps

Terminal 1 — backend:

```bash
cd backend
.venv\Scripts\Activate.ps1
python manage.py runserver
```

Terminal 2 — frontend:

```bash
cd frontend
npm run dev
```

Ensure the backend `.env` includes:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## Build for production

```bash
npm run build
npm run preview
```

The production bundle is generated in `dist/`. Configure the static host to serve `index.html` as a fallback for client-side routes such as `/dashboard` and `/status/:slug`.

## Notes

- The login form uses the backend's `username` + `password` token endpoint (not email login).
- Tokens are stored in `sessionStorage` for the current browser session. For a hardened production deployment, consider an HttpOnly secure-cookie authentication design and a corresponding backend change.
- The backend currently exposes at most 100 checks from the monitor checks endpoint; charts and tables use that returned history.
- Monitor analytics uptime is explicitly labelled as a sample-based estimate by the backend.
- Notification delivery runs synchronously in the current backend; channel management does not include a test-send endpoint yet.
- The current backend supports one owner per project; the frontend does not imply team collaboration or billing features that the API does not provide.
- Public pages display the current service states and active incidents returned by the backend. They do not claim historical uptime data because the public API does not expose it.
