# Pathway — Job Application Tracker (MERN)

A responsive job-application tracking app built with **MongoDB, Express, React, and Node.js**. Track applications from Applied through Interview and Offer to a final outcome, with a status timeline and follow-up reminders.

## Project structure

```text
project-root/
├── backend/
│   ├── .env                 # Local development config; replace URI for Atlas
│   ├── .env.example         # Atlas URI template (dummy placeholders only)
│   ├── package.json
│   └── src/
│       ├── middleware/errors.js
│       ├── models/           # Application and per-company sequence counter
│       ├── routes/applications.js
│       ├── utils/constants.js
│       └── server.js
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── src/                  # React UI, components, API client and styles
├── screenshots/
├── .gitignore
└── README.md
```

## Requirements

- Node.js 18 or newer
- MongoDB Atlas database (recommended for evaluation), or local MongoDB for development
- npm

## Setup and run

### 1. Configure MongoDB

The included `backend/.env` is a **local development configuration**, not a shared Atlas database credential. To use Atlas, open `backend/.env` and replace `MONGODB_URI` with your own test-cluster connection string. Alternatively copy `backend/.env.example` and fill in the Atlas username, password, and cluster hostname. In Atlas, add your evaluator/development IP to Network Access and create a database user with access to the test database. Never commit a real personal or production credential.

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

API runs at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

### 3. Start the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend calls `http://localhost:5000/api` by default. To change this, create `frontend/.env` with `VITE_API_URL=http://localhost:5000/api` and restart Vite.

## API reference

All endpoints return JSON in the shape `{ "success": boolean, "message": string, "data": object | array | null }`.

| Method | Endpoint | Description | Typical responses |
|---|---|---|---|
| GET | `/api/health` | Health check | `200` |
| GET | `/api/applications` | List applications; supports `?status=Applied` and `?search=google`; also returns status counts | `200`, `400` |
| POST | `/api/applications` | Create application; server generates application ID, follow-up date, initial status and history | `201`, `400`, `409` |
| GET | `/api/applications/:id` | Get one application and its status history | `200`, `404` |
| PUT | `/api/applications/:id` | Edit company, role, type, salary and notes; ID/date are immutable | `200`, `400`, `404`, `409` |
| PATCH | `/api/applications/:id/status` | Apply a valid status transition and append history | `200`, `400`, `404` |
| DELETE | `/api/applications/:id` | Delete only Applied or final-status applications | `200`, `400`, `404` |

### Business rules implemented

- Required company and role; job type must be Full-time, Internship, or Contract.
- Applied date is validated in both browser and backend and cannot be in the future.
- ID is generated server-side as `JA-<COMPANY PREFIX>-<3-digit sequence>`, with an atomic MongoDB counter per normalized company. Example: `JA-GOO-001`.
- New applications start as `Applied`; only the specified transitions are accepted by the backend. The UI offers only valid next statuses.
- Every status event stores its status and timestamp; details view shows the timeline.
- Follow-up date is seven days after applied date; `isOverdue` is true only when the current status remains Applied and the follow-up date has passed.
- Duplicate company + role pairs are compared case-insensitively and blocked with HTTP `409` while an earlier matching application is active.
- ID and applied date cannot be edited. Interview and Offer applications cannot be deleted.
- Status filtering, company search, and status counts are computed by the backend.

## live link
https://job-applications-tracker-1.onrender.com
