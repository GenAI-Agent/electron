# Multi-stage build for Supervisor Agent
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY frontend/ ./
RUN yarn build

# Python backend stage
FROM python:3.11-slim AS backend-builder

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY data/ ./data/
COPY task_memory/ ./task_memory/

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for serving frontend
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies and backend
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /app/backend ./backend
COPY --from=backend-builder /app/data ./data
COPY --from=backend-builder /app/task_memory ./task_memory

# Copy built frontend
COPY --from=frontend-builder /app/frontend/out ./frontend/out
COPY --from=frontend-builder /app/frontend/package.json ./frontend/

# Install serve for frontend
RUN npm install -g serve

# Expose ports
EXPOSE 8000 3000

# Create startup script
RUN echo '#!/bin/bash\n\
cd /app/backend && python main.py &\n\
cd /app/frontend && serve -s out -l 3000 &\n\
wait' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
