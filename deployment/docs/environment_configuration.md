# Environment Configuration Documentation

This document provides detailed information about the environment configuration for the Total Recall project.

## Environment Files

The Total Recall project uses environment files to configure the application for different environments. There are two main environment files:

1. **Development Environment** (`.env.example`): Located at the root of the project
2. **Production Environment** (`docker/.env.prod.example`): Located in the `docker` directory

### Development Environment (.env.example)

```
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
LOG_LEVEL=DEBUG

# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=totalrecall
DB_USER=postgres
DB_PASSWORD=postgres

# Application Settings
MAX_MEMORY_SIZE=1024
ENABLE_FEATURES=conversation_extraction,memory_injection
```

### Production Environment (docker/.env.prod.example)

```
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=totalrecall
DB_USER=postgres
# DB_PASSWORD should be set via secrets management (e.g., Docker secrets)
DB_PASSWORD=

# Application Settings
MAX_MEMORY_SIZE=4096
ENABLE_FEATURES=conversation_extraction,memory_injection

# Security Settings
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=60

# Monitoring
ENABLE_PROMETHEUS=true
PROMETHEUS_PORT=9090
```

## Environment Variables

### Required Variables

#### API Configuration
- `API_HOST`: Host address for the API server (default: 0.0.0.0)
- `API_PORT`: Port for the API server (default: 8000)

#### Database Configuration
- `DB_HOST`: Database host address (default: db)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: totalrecall)
- `DB_USER`: Database username (default: postgres)
- `DB_PASSWORD`: Database password (required in development, provided via secrets in production)

### Optional Variables

#### Application Settings
- `DEBUG`: Enable debug mode (default: true in development, false in production)
- `LOG_LEVEL`: Logging level (default: DEBUG in development, INFO in production)
- `MAX_MEMORY_SIZE`: Maximum memory size in MB (default: 1024 in development, 4096 in production)
- `ENABLE_FEATURES`: Comma-separated list of enabled features (default: conversation_extraction,memory_injection)

#### Security Settings (Production Only)
- `ENABLE_RATE_LIMITING`: Enable rate limiting (default: true)
- `MAX_REQUESTS_PER_MINUTE`: Maximum requests per minute when rate limiting is enabled (default: 60)

#### Monitoring (Production Only)
- `ENABLE_PROMETHEUS`: Enable Prometheus metrics (default: true)
- `PROMETHEUS_PORT`: Port for Prometheus metrics (default: 9090)

## Secrets Management

The Total Recall project uses Docker secrets for managing sensitive information in production. The secrets are stored in the `secrets` directory.

### Setup

The `setup_secrets.sh` script is used to set up secrets:

```bash
./setup_secrets.sh
```

This script:
1. Creates the `secrets` directory if it doesn't exist
2. Generates a random password for the database
3. Creates a secret file for the database password
4. Creates a README file for the secrets directory

### Secret Files

- `db_password.txt`: Contains the PostgreSQL database password

### Security Notes

- Secret files should never be committed to version control
- In production environments, consider using a dedicated secrets management solution
- For cloud deployments, use the cloud provider's secrets management service:
  - AWS: AWS Secrets Manager or Parameter Store
  - GCP: Secret Manager
  - Azure: Key Vault
  - Heroku: Config Vars
  - Digital Ocean: App Platform Environment Variables

## Environment-Specific Configuration

### Development vs. Production

The main differences between development and production environments are:

| Setting | Development | Production |
|---------|-------------|------------|
| DEBUG | true | false |
| LOG_LEVEL | DEBUG | INFO |
| MAX_MEMORY_SIZE | 1024 | 4096 |
| Rate Limiting | Disabled | Enabled |
| Prometheus | Optional | Enabled |
| Secrets | Plain text | Docker secrets |

### Environment Setup

#### Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to customize settings if needed.

#### Production

1. Copy the example production environment file:
   ```bash
   cp docker/.env.prod.example docker/.env.prod
   ```

2. Set up secrets:
   ```bash
   ./setup_secrets.sh
   ```

3. Edit the `docker/.env.prod` file to customize settings if needed.

## Best Practices

1. **Never commit environment files with sensitive information to version control**
2. **Use different environment files for different environments**
3. **Use Docker secrets for sensitive information in production**
4. **Set appropriate values for resource limits based on the environment**
5. **Enable security features like rate limiting in production**

## Troubleshooting

### Common Issues

1. **Missing environment file**:
   - Ensure the environment file exists in the correct location
   - Copy the example file if needed

2. **Incorrect database credentials**:
   - Verify the database credentials in the environment file
   - Check that the database container is running

3. **Permission issues with secrets**:
   - Ensure the secrets directory and files have the correct permissions
   - Run the `setup_secrets.sh` script to set up secrets properly
