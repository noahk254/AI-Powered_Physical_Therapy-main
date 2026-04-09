# Build stage
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY sites/ai-therapy/package*.json ./
RUN npm ci
COPY sites/ai-therapy/ .
RUN npm run build

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./sites/ai-therapy/dist

ENV PYTHONUNBUFFERED=1
ENV CORS_ORIGINS=*

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
