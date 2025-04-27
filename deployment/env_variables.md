# Environment Variables Documentation

This document provides details about all environment variables used in the Total Recall project.

## Required Variables

### API Configuration
- `API_HOST`: Host address for the API server (default: 0.0.0.0)
- `API_PORT`: Port for the API server (default: 8000)

### Database Configuration
- `DB_HOST`: Database host address (default: db)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: totalrecall)
- `DB_USER`: Database username (default: postgres)
- `DB_PASSWORD`: Database password (required in development, provided via secrets in production)

## Optional Variables

### Application Settings
- `DEBUG`: Enable debug mode (default: true in development, false in production)
- `LOG_LEVEL`: Logging level (default: DEBUG in development, INFO in production)
- `MAX_MEMORY_SIZE`: Maximum memory size in MB (default: 1024 in development, 4096 in production)
- `ENABLE_FEATURES`: Comma-separated list of enabled features (default: conversation_extraction,memory_injection)

### Security Settings (Production Only)
- `ENABLE_RATE_LIMITING`: Enable rate limiting (default: true)
- `MAX_REQUESTS_PER_MINUTE`: Maximum requests per minute when rate limiting is enabled (default: 60)

### Monitoring (Production Only)
- `ENABLE_PROMETHEUS`: Enable Prometheus metrics (default: true)
- `PROMETHEUS_PORT`: Port for Prometheus metrics (default: 9090)

## Sensitive Variables

The following variables contain sensitive information and should be handled securely:

- `DB_PASSWORD`: Database password
  - Development: Stored in .env file
  - Production: Provided via Docker secrets

## Environment-Specific Variables

### Development Environment
- `DEBUG=true`
- `LOG_LEVEL=DEBUG`
- `MAX_MEMORY_SIZE=1024`

### Production Environment
- `DEBUG=false`
- `LOG_LEVEL=INFO`
- `MAX_MEMORY_SIZE=4096`
- `ENABLE_RATE_LIMITING=true`
- `MAX_REQUESTS_PER_MINUTE=60`
- `ENABLE_PROMETHEUS=true`
- `PROMETHEUS_PORT=9090`
