#!/bin/bash

# Install script for Total Recall using Docker
# This script sets up the Total Recall application using Docker and Docker Compose

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Set up configuration
echo "Setting up configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template. Please edit it with your configuration."
fi

# Build and start the containers
echo "Building and starting Docker containers..."
docker-compose build
docker-compose up -d

echo "Installation complete!"
echo "The Total Recall application is now running at http://localhost:8000"
echo "To stop the application, run: docker-compose down"
