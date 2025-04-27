# Docker Configuration Documentation

This document provides detailed information about the Docker configuration for the Total Recall project.

## Dockerfile

The Total Recall project uses a multi-stage build Dockerfile to optimize image size and performance. The Dockerfile is located at the root of the project.

### Structure

The Dockerfile consists of two stages:

1. **Builder Stage**: Installs build dependencies and compiles the application
2. **Runtime Stage**: Contains only the necessary runtime components

### Builder Stage

```dockerfile
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
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

The builder stage:
- Uses Python 3.10 slim image as the base
- Installs build dependencies (build-essential, gcc)
- Creates a virtual environment to isolate dependencies
- Installs Python dependencies from requirements.txt

### Runtime Stage

```dockerfile
# Stage 2: Runtime image
FROM python:3.10-slim AS runtime

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user
RUN useradd -m totalrecall
WORKDIR /home/totalrecall/app

# Copy application code
COPY . .

# Set ownership
RUN chown -R totalrecall:totalrecall /home/totalrecall

# Switch to non-root user
USER totalrecall

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set entrypoint
ENTRYPOINT ["python", "app.py"]

# Expose port
EXPOSE 8000
```

The runtime stage:
- Uses Python 3.10 slim image as the base
- Copies only the virtual environment from the builder stage
- Creates a non-root user for security
- Sets the working directory
- Copies the application code
- Sets proper ownership of files
- Configures a health check
- Sets the entrypoint to run the application
- Exposes port 8000

## Docker Compose Configurations

### Development Configuration (docker-compose.yml)

The development configuration is located at the root of the project in `docker-compose.yml`.

```yaml
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
    depends_on:
      - db
    restart: unless-stopped

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
```

Key features:
- Mounts the local directory for hot-reloading during development
- Uses a PostgreSQL database with simple configuration
- Defines persistent volumes for data storage
- Configures automatic restart of containers

### Production Configuration (docker/docker-compose.prod.yml)

The production configuration is located in the `docker` directory in `docker-compose.prod.yml`.

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - total_recall_data:/data
    environment:
      - ENV_FILE=.env.prod
    depends_on:
      - db
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=totalrecall
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  total_recall_data:
  postgres_data:
```

Key features:
- Does not mount the local directory (uses the code built into the image)
- Uses Docker secrets for sensitive information
- Includes an Nginx service for reverse proxy and SSL termination
- Configures resource limits for containers
- Defines health checks for all services
- Uses the production environment file

## Development with Docker Compose

For development, use the standard `docker-compose.yml` file:

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment with Docker Compose

For production, use the production configuration:

```bash
# Build and start services
docker-compose -f docker/docker-compose.prod.yml up -d

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.prod.yml down
```

## Best Practices

The Docker configuration follows these best practices:

1. **Multi-stage builds** to minimize image size
2. **Non-root user** for security
3. **Health checks** for monitoring container health
4. **Resource limits** to prevent resource exhaustion
5. **Secrets management** for sensitive information
6. **Persistent volumes** for data storage
7. **Automatic restart** for reliability

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check logs: `docker-compose logs api`
   - Verify environment variables
   - Check for port conflicts

2. **Database connection issues**:
   - Ensure the database container is running
   - Verify database credentials
   - Check network connectivity between containers

3. **Permission issues**:
   - Check file ownership and permissions
   - Ensure volumes are properly mounted

### Debugging

For debugging, you can:

1. Access a running container:
   ```bash
   docker-compose exec api bash
   ```

2. View container logs:
   ```bash
   docker-compose logs -f api
   ```

3. Check container health:
   ```bash
   docker ps
   ```
