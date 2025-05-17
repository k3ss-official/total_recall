#!/bin/bash

# Start services with hot-reloading
echo "Starting development environment with hot-reloading..."

# Create docker-compose.dev.yml if it doesn't exist
if [ ! -f "docker-compose.dev.yml" ]; then
  cat > docker-compose.dev.yml << EOF
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./:/home/totalrecall/app
      - total_recall_data:/data
    environment:
      - ENV_FILE=.env
      - DEBUG=true
    depends_on:
      - db
    restart: unless-stopped
    command: ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_DB=totalrecall
    restart: unless-stopped

volumes:
  total_recall_data:
  postgres_data:
EOF
  echo "Created docker-compose.dev.yml with hot-reloading configuration."
fi

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

# Start services with hot-reloading
docker-compose -f docker-compose.dev.yml up -d

# Run tests if requested
if [ "$1" == "--test" ]; then
  echo "Running tests..."
  docker-compose -f docker-compose.dev.yml exec api pytest
fi

# Enable debug mode
export DEBUG=true

echo "Development environment started!"
echo "API is available at: http://localhost:8000"
echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "To stop services: docker-compose -f docker-compose.dev.yml down"
