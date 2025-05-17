#!/bin/bash

# Check for prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Set up environment
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
  echo "Please update the .env file with your configuration."
fi

# Set up secrets
if [ ! -d "secrets" ]; then
  echo "Setting up secrets..."
  ./setup_secrets.sh
fi

# Build containers
echo "Building Docker containers..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Initialize database if needed
echo "Checking if database initialization is needed..."
docker-compose exec api python scripts/init_db.py || {
  echo "Database initialization script not found or failed. This is normal for first-time setup."
}

# Provide access URLs
echo "Services started successfully!"
echo "API is available at: http://localhost:8000"
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
