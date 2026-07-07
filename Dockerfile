# TechVanguard — Dockerfile
# Multi-stage: backend (Python) + frontend (Node)

# ── Stage 1: Backend ────────────────────────────────────────────────
FROM python:3.11-slim AS backend

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# ── Stage 2: Frontend ───────────────────────────────────────────────
FROM node:22-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
