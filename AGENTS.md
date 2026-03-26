# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
TherapyAI is an AI-powered physical therapy assistant with a React/TypeScript frontend (Vite) and a Python/FastAPI backend. SQLite is embedded (auto-created on first backend run). No external services or Docker required.

### Running services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend | `npm run dev` | 5173 | Vite dev server |
| Backend | `cd backend && source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000` | 8000 | Or `npm run backend` (but use venv's Python) |

### Key caveats

- **Python venv**: Backend dependencies live in `backend/venv/`. Always activate it (`source backend/venv/bin/activate`) before running the backend or installing Python packages.
- **`sqlite3` in `requirements.txt`**: This is a Python stdlib module and must be skipped during `pip install`. Filter it out: `grep -v '^sqlite3' backend/requirements.txt`.
- **mediapipe version**: The pinned version (0.10.7) is incompatible with Python 3.12. Use `mediapipe==0.10.14` which still provides the `mp.solutions` API that `pose_analyzer.py` relies on.
- **TensorFlow**: Not directly imported in backend code; it's a transitive dependency of mediapipe. TF 2.16.x is compatible with both Python 3.12 and mediapipe's protobuf requirements. If TF causes import errors, it can be uninstalled without breaking the backend.
- **System dependency**: `libgl1` is needed for OpenCV on headless Linux (`sudo apt-get install -y libgl1 libglib2.0-0`).
- **ESLint**: Pre-existing unused-import error in `src/components/Dashboard.tsx` (`Calendar`). ESLint also scans inside `backend/venv/` (matplotlib JS files); this is harmless.
- **No automated tests**: The repository has no test suite. Validate changes via lint (`npm run lint`), TypeScript check (`npx tsc --noEmit`), and manual testing.
- **Backend CORS**: Configured for `localhost:5173` and `localhost:3000`.

### Standard commands (see `package.json`)
- `npm run dev` — start frontend dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run backend` — start backend (ensure venv is activated)
