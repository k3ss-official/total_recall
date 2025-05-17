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

# Install dependencies
# Assuming requirements.txt exists in the context
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime image
FROM python:3.10-slim AS runtime

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user
RUN useradd -m totalrecall
WORKDIR /home/totalrecall/app

# Copy application code
# Assuming application code exists in the context
COPY . .

# Set ownership
RUN chown -R totalrecall:totalrecall /home/totalrecall

# Switch to non-root user
USER totalrecall

# Health check (Assuming the app runs on port 8000 and has a /health endpoint)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set entrypoint (Assuming the main application file is app.py)
ENTRYPOINT ["python", "app.py"]

# Expose port (Assuming the app runs on port 8000)
EXPOSE 8000

