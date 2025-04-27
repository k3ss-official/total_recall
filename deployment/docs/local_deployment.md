# Local Deployment Documentation

This document provides detailed information about the local deployment process for the Total Recall project.

## Prerequisites

Before deploying the Total Recall project locally, ensure you have the following prerequisites installed:

- Docker (version 20.10.0 or later)
- Docker Compose (version 2.0.0 or later)
- Bash shell (for running scripts)

## Deployment Scripts

The Total Recall project includes two main scripts for local deployment:

1. **Production-like Deployment** (`deploy_local.sh`): For deploying a production-like environment locally
2. **Development Deployment** (`dev.sh`): For development with hot-reloading

### Production-like Deployment (deploy_local.sh)

The `deploy_local.sh` script is located at the root of the project and is used to deploy a production-like environment locally.

#### Usage

```bash
./deploy_local.sh
```

#### What the Script Does

1. Checks for prerequisites (Docker and Docker Compose)
2. Sets up the environment file if it doesn't exist
3. Sets up secrets if they don't exist
4. Builds Docker containers
5. Starts services
6. Initializes the database if needed
7. Provides access URLs

#### Example Output

```
Checking for prerequisites...
Creating .env file from template...
Setting up secrets...
Building Docker containers...
Starting services...
Checking if database initialization is needed...
Services started successfully!
API is available at: http://localhost:8000
To view logs: docker-compose logs -f
To stop services: docker-compose down
```

### Development Deployment (dev.sh)

The `dev.sh` script is located at the root of the project and is used for development with hot-reloading.

#### Usage

```bash
./dev.sh [--test]
```

Options:
- `--test`: Run tests after starting the services

#### What the Script Does

1. Creates a development-specific Docker Compose file with hot-reloading
2. Sets up the environment file if it doesn't exist
3. Sets up secrets if they don't exist
4. Starts services with hot-reloading
5. Runs tests if requested
6. Enables debug mode
7. Provides access URLs

#### Example Output

```
Starting development environment with hot-reloading...
Created docker-compose.dev.yml with hot-reloading configuration.
Creating .env file from template...
Setting up secrets...
Starting services...
Development environment started!
API is available at: http://localhost:8000
To view logs: docker-compose -f docker-compose.dev.yml logs -f
To stop services: docker-compose -f docker-compose.dev.yml down
```

## Manual Deployment

If you prefer to deploy manually without using the scripts, follow these steps:

### Development Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Build and start the services:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. View logs:
   ```bash
   docker-compose logs -f
   ```

4. Stop services:
   ```bash
   docker-compose down
   ```

### Production-like Environment

1. Copy the example production environment file:
   ```bash
   cp docker/.env.prod.example docker/.env.prod
   ```

2. Set up secrets:
   ```bash
   ./setup_secrets.sh
   ```

3. Build and start the services:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml build
   docker-compose -f docker/docker-compose.prod.yml up -d
   ```

4. View logs:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml logs -f
   ```

5. Stop services:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml down
   ```

## Accessing the Application

Once deployed, the application can be accessed at:

- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs (if using FastAPI)

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   - If port 8000 is already in use, you can change the port in the `.env` file
   - Alternatively, you can modify the port mapping in the Docker Compose file

2. **Docker Compose errors**:
   - Ensure Docker and Docker Compose are installed and running
   - Check for syntax errors in the Docker Compose file

3. **Database initialization errors**:
   - Check the database logs: `docker-compose logs db`
   - Ensure the database credentials are correct in the environment file

4. **Permission issues**:
   - Ensure the deployment scripts are executable: `chmod +x deploy_local.sh dev.sh`
   - Check file permissions for mounted volumes

### Debugging

For debugging, you can:

1. View logs:
   ```bash
   docker-compose logs -f
   ```

2. Access a running container:
   ```bash
   docker-compose exec api bash
   ```

3. Check container status:
   ```bash
   docker-compose ps
   ```

## Best Practices

1. **Always use the provided scripts for deployment** to ensure consistent environments
2. **Keep environment files up to date** with the latest configuration options
3. **Regularly update Docker images** to get the latest security patches
4. **Back up data regularly** using the provided backup scripts
5. **Monitor container health** using the health check endpoints
