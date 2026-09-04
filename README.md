# TherapyAI — AI-Powered Physical Therapy Assistant

TherapyAI uses real-time pose tracking and machine learning to guide patients through physical therapy exercises with instant corrective feedback. Patients complete guided exercise sessions via webcam, while doctors monitor progress, prescribe exercises, and generate reports.

## Features

### Patient
- **Real-time exercise guidance** — MediaPipe Pose tracks body landmarks (shoulders, elbows, hips, knees) frame-by-frame and scores every rep.
- **Instant feedback** — live score, form corrections, and success/failure detection for each movement (HTTP and WebSocket).
- **Guided sessions** — step-by-step exercise instructions, target angles, tips, and embedded demo videos.
- **Progress dashboard** — accuracy, average scores, active days, and improvement trends over time.
- **Scheduler** — schedule exercises and track completion.
- **Therapy plans & prescriptions** — view exercises and guidance assigned by your doctor.

### Doctor
- **Patient management** — assign, search, and remove patients.
- **Invite codes** — invite patients to link accounts to your practice.
- **Assign sessions & prescriptions** — schedule sessions and prescribe exercises with sets, reps, and frequency.
- **Reports** — generate per-patient progress reports, trend analysis, and compliance rates.

## Supported Exercises

| Exercise | Target joints |
|----------|---------------|
| Shoulder Raises | Shoulders |
| Arm Circles | Shoulders |
| Wall Push-ups | Elbows |
| Squats | Knees, hips |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Python, FastAPI, Uvicorn |
| Pose analysis | MediaPipe Pose (0.10.14), OpenCV, NumPy |
| Database | SQLite (auto-created on first run) |

## Project Structure

```
.
├── sites/ai-therapy/          # Frontend (React + Vite)
│   └── src/
│       ├── context/           # Auth context
│       ├── pages/             # Landing, Login, Signup, dashboards, reports
│       ├── components/        # Shared UI components
│       └── services/api.ts    # Backend API client
├── backend/                   # Backend (FastAPI)
│   ├── main.py                # API routes + WebSocket endpoint
│   ├── pose_analyzer.py       # MediaPipe pose analysis engine
│   ├── database.py            # SQLite data layer
│   ├── models.py              # Pydantic schemas
│   └── therapy_ai.db          # SQLite database (auto-generated)
├── Dockerfile                 # Single-container image (frontend + backend + API)
└── docker-compose.yml         # Runs everything on port 8000 with a persisted DB
```

## Getting Started

There are two ways to run the project: **Docker** or **locally**. Pick one.

### Option A — Docker (one command)

Requires [Docker](https://docs.docker.com/get-docker/) (Compose v2 included).

```bash
docker compose up --build
```

Open http://localhost:8000, create an account, and start an exercise session. The API docs are at `http://localhost:8000/docs`.

Useful commands:

```bash
docker compose up --build   # build and start
docker compose down         # stop containers (data is kept)
docker compose down -v      # stop and delete the SQLite database volume
docker compose logs -f      # follow logs
```

The image builds the frontend and serves it from the backend, with the SQLite database stored in a named Docker volume so data survives `down`/rebuilds.

### Option B — Run locally

#### Prerequisites

- Node.js 18+ and npm
- Python 3.12 (`backend/venv/` is the project's virtual environment)
- `libgl1` and `libglib2.0-0` for OpenCV on headless Linux:
  ```bash
  sudo apt-get install -y libgl1 libglib2.0-0
  ```

#### 1. Start the backend (port 8000)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The SQLite database is created automatically on first start. The API docs are available at `http://localhost:8000/docs`.

#### 2. Start the frontend (port 5173)

```bash
cd sites/ai-therapy
npm install
npm run dev
```

Open http://localhost:5173, create an account, and start an exercise session.

#### Production build

```bash
cd sites/ai-therapy && npm run build
```

The backend serves the built frontend (from `sites/ai-therapy/dist`) for all non-API routes.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register`, `/auth/login` | User authentication (patient/doctor) |
| POST | `/upload` | Analyze a single pose frame (base64 image) |
| POST | `/analyze` | Detailed pose analysis |
| WS | `/ws/{user_id}` | Real-time frame streaming + feedback |
| POST | `/session/start`, `/session/end` | Start/end a therapy session |
| GET | `/progress/{user_id}` | Progress data + summary |
| GET | `/exercises` | Supported exercise list |
| GET/POST | `/schedule...` | Exercise scheduling + completion |
| GET | `/doctor/...` | Patient management, invites, reports, therapy plans, prescriptions |
| GET | `/patient/...` | Plans, prescriptions, trend, compliance |
| GET | `/reports`, `/report/{id}` | Saved reports |
| GET | `/health` | Health check |

## Notes

- **Pose analysis** runs real-time with a webcam; a quality camera and good lighting improve accuracy.
- **CORS** allows `localhost:5173` and `localhost:3000`; override with the `CORS_ORIGINS` environment variable.
- The app is fully local — no external services or cloud accounts required. Docker is optional convenience.