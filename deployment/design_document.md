# Total Recall Deployment Automation Design Document

## Overview

This document outlines the design for the deployment automation solution for the Total Recall project. The solution includes Docker configurations, environment management, deployment scripts, CI/CD pipelines, monitoring setup, and backup procedures.

## 1. Docker Configuration

### 1.1 Dockerfile Design

We will implement a multi-stage build Dockerfile to optimize image size and performance:

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
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Set entrypoint
ENTRYPOINT ["python", "app.py"]
```

### 1.2 Docker Compose Configurations

#### Development Configuration (docker-compose.yml)

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

#### Production Configuration (docker/docker-compose.prod.yml)

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

## 2. Environment Configuration

### 2.1 Environment Variables

We will create two environment configuration templates:

#### Development Environment (.env.example)

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

#### Production Environment (docker/.env.prod.example)

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

### 2.2 Secrets Management

For sensitive information, we will implement a secrets management approach:

1. Development: Use .env file with default values
2. Production: Use Docker secrets for sensitive values
3. Cloud: Use cloud provider's secrets management service

## 3. Local Deployment Scripts

### 3.1 Local Deployment Script (deploy_local.sh)

```bash
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

# Build containers
echo "Building Docker containers..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Initialize database if needed
echo "Checking if database initialization is needed..."
docker-compose exec api python scripts/init_db.py

# Provide access URLs
echo "Services started successfully!"
echo "API is available at: http://localhost:8000"
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
```

### 3.2 Local Development Script (dev.sh)

```bash
#!/bin/bash

# Start services with hot-reloading
echo "Starting development environment with hot-reloading..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run tests if requested
if [ "$1" == "--test" ]; then
  echo "Running tests..."
  docker-compose exec api pytest
fi

# Enable debug mode
export DEBUG=true

echo "Development environment started!"
echo "API is available at: http://localhost:8000"
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
```

## 4. Cloud Deployment

### 4.1 AWS Elastic Beanstalk Configuration

```yaml
# .elasticbeanstalk/config.yml
branch-defaults:
  main:
    environment: totalrecall-prod
    group_suffix: null
global:
  application_name: totalrecall
  branch: null
  default_ec2_keyname: aws-eb
  default_platform: Docker
  default_region: us-west-2
  include_git_submodules: true
  instance_profile: null
  platform_name: null
  platform_version: null
  profile: eb-cli
  repository: null
  sc: git
  workspace_type: Application
```

### 4.2 Google Cloud Run Configuration

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/totalrecall', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/totalrecall']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'totalrecall'
      - '--image'
      - 'gcr.io/$PROJECT_ID/totalrecall'
      - '--platform'
      - 'managed'
      - '--region'
      - 'us-central1'
      - '--allow-unauthenticated'
```

### 4.3 Azure App Service Configuration

```json
// azure-pipelines.yml
{
  "trigger": ["main"],
  "resources": {
    "repositories": {
      "self": {
        "clean": "true"
      }
    }
  },
  "stages": [
    {
      "stage": "Build",
      "jobs": [
        {
          "job": "BuildJob",
          "steps": [
            {
              "task": "Docker@2",
              "inputs": {
                "containerRegistry": "dockerRegistry",
                "repository": "totalrecall",
                "command": "buildAndPush",
                "Dockerfile": "**/Dockerfile"
              }
            }
          ]
        }
      ]
    },
    {
      "stage": "Deploy",
      "jobs": [
        {
          "job": "DeployJob",
          "steps": [
            {
              "task": "AzureWebAppContainer@1",
              "inputs": {
                "azureSubscription": "$(azureSubscription)",
                "appName": "totalrecall",
                "imageName": "$(dockerRegistry)/totalrecall:$(Build.BuildId)"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 4.4 Heroku Configuration

```json
// heroku.yml
{
  "build": {
    "docker": {
      "web": "Dockerfile"
    }
  }
}
```

### 4.5 Digital Ocean App Platform Configuration

```yaml
# .do/app.yaml
name: totalrecall
services:
  - name: api
    github:
      repo: username/totalrecall
      branch: main
    dockerfile_path: Dockerfile
    http_port: 8000
    instance_count: 1
    instance_size_slug: basic-xs
    routes:
      - path: /
    envs:
      - key: DEBUG
        value: "false"
      - key: LOG_LEVEL
        value: "INFO"
databases:
  - name: db
    engine: PG
    version: "14"
```

## 5. CI/CD Pipeline Configurations

### 5.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Test with pytest
        run: |
          pytest --cov=./ --cov-report=xml
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: username/totalrecall:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deployment script or command
          echo "Deploying to production..."
```

### 5.2 GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""

test:
  stage: test
  image: python:3.10-slim
  script:
    - pip install -r requirements.txt
    - pip install pytest pytest-cov
    - pytest --cov=./ --cov-report=term

build:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST $DEPLOYMENT_WEBHOOK_URL
  only:
    - main
```

### 5.3 CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/python:3.10
    steps:
      - checkout
      - setup_remote_docker:
          version: 20.10.14
      - run:
          name: Install dependencies
          command: |
            python -m venv venv
            . venv/bin/activate
            pip install -r requirements.txt
            pip install pytest pytest-cov
      - run:
          name: Run tests
          command: |
            . venv/bin/activate
            pytest --cov=./ --cov-report=xml

  build:
    docker:
      - image: cimg/python:3.10
    steps:
      - checkout
      - setup_remote_docker:
          version: 20.10.14
      - run:
          name: Build and push Docker image
          command: |
            docker build -t username/totalrecall:latest .
            echo $DOCKER_PWD | docker login -u $DOCKER_LOGIN --password-stdin
            docker push username/totalrecall:latest

  deploy:
    docker:
      - image: cimg/python:3.10
    steps:
      - checkout
      - run:
          name: Deploy to production
          command: |
            # Deployment script or command
            echo "Deploying to production..."

workflows:
  version: 2
  build-test-deploy:
    jobs:
      - test
      - build:
          requires:
            - test
          filters:
            branches:
              only: main
      - deploy:
          requires:
            - build
          filters:
            branches:
              only: main
```

### 5.4 Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent {
        docker {
            image 'python:3.10-slim'
        }
    }
    stages {
        stage('Test') {
            steps {
                sh 'pip install -r requirements.txt'
                sh 'pip install pytest pytest-cov'
                sh 'pytest --cov=./ --cov-report=xml'
            }
        }
        stage('Build') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker build -t username/totalrecall:latest .'
                sh 'docker push username/totalrecall:latest'
            }
        }
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'echo "Deploying to production..."'
                // Deployment script or command
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}
```

## 6. Monitoring and Logging

### 6.1 Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'totalrecall'
    static_configs:
      - targets: ['api:8000']
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 6.2 Grafana Dashboard Configuration

```json
// grafana/dashboards/totalrecall.json
{
  "annotations": {
    "list": []
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.5.5",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "rate(http_requests_total[1m])",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "HTTP Request Rate",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "schemaVersion": 27,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Total Recall Dashboard",
  "uid": "totalrecall",
  "version": 1
}
```

### 6.3 Logging Configuration

```yaml
# logging/fluentd.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<match *.**>
  @type copy
  <store>
    @type elasticsearch
    host elasticsearch
    port 9200
    logstash_format true
    logstash_prefix fluentd
    logstash_dateformat %Y%m%d
    include_tag_key true
    type_name access_log
    tag_key @log_name
    flush_interval 1s
  </store>
  <store>
    @type stdout
  </store>
</match>
```

## 7. Backup and Recovery

### 7.1 Database Backup Script

```bash
#!/bin/bash
# backup_db.sh

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
docker-compose exec -T db pg_dump -U postgres totalrecall > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 7.2 Database Restore Script

```bash
#!/bin/bash
# restore_db.sh

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Extract backup if compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Extracting backup file..."
  gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore database
echo "Restoring database from $BACKUP_FILE..."
docker-compose exec -T db psql -U postgres -d totalrecall < $BACKUP_FILE

echo "Database restore completed."
```

### 7.3 Volume Backup Script

```bash
#!/bin/bash
# backup_volumes.sh

# Configuration
BACKUP_DIR="/backups/volumes"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/volumes_backup_$TIMESTAMP.tar.gz"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Stop containers
echo "Stopping containers..."
docker-compose stop

# Backup volumes
echo "Backing up volumes..."
docker run --rm \
  -v $(docker volume ls -q | grep total_recall):/volumes \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/volumes_backup_$TIMESTAMP.tar.gz /volumes

# Restart containers
echo "Restarting containers..."
docker-compose start

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "volumes_backup_*.tar.gz" -type f -mtime +7 -delete

echo "Volume backup completed: $BACKUP_FILE"
```

## 8. Scaling Configuration

### 8.1 Horizontal Scaling with Docker Swarm

```yaml
# docker-compose.swarm.yml
version: '3.8'

services:
  api:
    image: username/totalrecall:latest
    ports:
      - "8000:8000"
    volumes:
      - total_recall_data:/data
    environment:
      - ENV_FILE=.env.prod
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=totalrecall
    deploy:
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '1'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  total_recall_data:
  postgres_data:
```

### 8.2 Load Balancing Configuration

```nginx
# nginx/conf.d/default.conf
upstream totalrecall {
    server api:8000;
    # Additional servers can be added here for load balancing
    # server api2:8000;
    # server api3:8000;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://totalrecall;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://totalrecall/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
        proxy_http_version 1.1;
    }
}
```

## 9. Implementation Plan

1. Create base directory structure
2. Implement Dockerfile with multi-stage build
3. Create docker-compose configurations for development and production
4. Set up environment configuration templates
5. Implement local deployment scripts
6. Configure cloud deployment options
7. Set up CI/CD pipeline configurations
8. Configure monitoring and logging
9. Implement backup and recovery procedures
10. Document all components and usage instructions

## 10. Testing Strategy

1. Test Dockerfile builds
2. Test docker-compose configurations
3. Test local deployment scripts
4. Test environment configuration
5. Test cloud deployment configurations (if possible)
6. Verify monitoring and logging setup
7. Test backup and recovery procedures

## 11. Conclusion

This design document outlines a comprehensive deployment automation solution for the Total Recall project. The solution includes Docker configurations, environment management, deployment scripts, CI/CD pipelines, monitoring setup, and backup procedures. The implementation will follow best practices for Docker, security, and deployment automation.
