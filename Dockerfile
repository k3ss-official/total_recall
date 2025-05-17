# Stage 1: Build dependencies
FROM python:3.10-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set up virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY ./api/app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Frontend build
FROM node:16-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY ./frontend .
RUN npm run build

# Stage 3: Runtime image
FROM python:3.10-slim AS runtime

# Install required packages for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user
RUN useradd -m totalrecall
WORKDIR /home/totalrecall/app

# Copy application code
COPY ./api/app ./api
COPY --from=frontend-builder /app/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p /data/logs /data/exports

# Set ownership
RUN chown -R totalrecall:totalrecall /home/totalrecall /data

# Switch to non-root user
USER totalrecall

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set entrypoint
ENTRYPOINT ["python", "-m", "api.main"]

# Expose port
EXPOSE 8000
