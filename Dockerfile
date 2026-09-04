# Stage 1: build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY sites/ai-therapy/package*.json ./
RUN npm ci
COPY sites/ai-therapy/ ./
RUN npm run build

# Stage 2: backend runtime (serves built frontend + API)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# System libs required by OpenCV / MediaPipe on headless Linux
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libgomp1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/

# Built frontend copied to the location the backend expects (repo layout: sites/ai-therapy/dist)
COPY --from=frontend-build /app/frontend/dist sites/ai-therapy/dist

WORKDIR /app/backend
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]