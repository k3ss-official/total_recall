# Total Recall: Deployment Automation

This repository contains the deployment automation configurations for the Total Recall project. Total Recall is an open-source tool that automatically extracts historical GPT conversations and injects them into GPT's persistent memory.

This deployment automation solution provides robust Docker configurations and deployment scripts to make it easy to set up and run the system in various environments, from local development to production deployment.

## Features

- **Dockerized Application**: Multi-stage Dockerfile for optimized image size and performance.
- **Docker Compose**: Configurations for both development (`docker-compose.yml`) and production (`docker/docker-compose.prod.yml`) environments.
- **Environment Configuration**: Templates for `.env` files and clear documentation for all variables.
- **Secrets Management**: Secure handling of sensitive information using Docker secrets in production.
- **Local Deployment Scripts**: Easy-to-use scripts (`deploy_local.sh`, `dev.sh`) for local setup.
- **Cloud Deployment Ready**: Configurations for popular cloud platforms (AWS, GCP, Azure, Heroku, Digital Ocean).
- **CI/CD Pipelines**: Example configurations for GitHub Actions, GitLab CI, CircleCI, and Jenkins.
- **Monitoring & Logging**: Setup for Prometheus, Grafana, and Fluentd.
- **Backup & Recovery**: Scripts for database and volume backups and restores.
- **Scaling Configuration**: Documentation and examples for scaling the application.

## Prerequisites

- Docker (version 20.10.0 or later)
- Docker Compose (version 2.0.0 or later)
- Bash shell
- Cloud provider CLIs (as needed for cloud deployment)

## Directory Structure

```
.
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── deploy_local.sh
├── dev.sh
├── setup_secrets.sh
├── requirements.txt
├── app.py
├── secrets/
│   ├── README.md
│   └── db_password.txt
├── docker/
│   ├── docker-compose.prod.yml
│   └── .env.prod.example
├── .github/workflows/
│   └── ci.yml
├── .gitlab-ci.yml
├── .circleci/
│   └── config.yml
├── Jenkinsfile
├── .elasticbeanstalk/
│   └── config.yml
├── cloudbuild.yaml
├── .do/
│   └── app.yaml
├── heroku.yml
├── azure-pipelines.yml
├── prometheus/
│   └── prometheus.yml
├── grafana/dashboards/
│   └── totalrecall.json
├── logging/
│   └── fluentd.conf
├── backup_db.sh
├── restore_db.sh
├── backup_volumes.sh
├── scaling_configuration.md
├── env_variables.md
├── docs/
│   ├── docker_configuration.md
│   ├── environment_configuration.md
│   ├── local_deployment.md
│   ├── cloud_deployment.md
│   ├── monitoring_logging.md
│   └── backup_recovery.md
└── README.md
```

## Local Deployment

### Development Environment

For development with hot-reloading:

```bash
./dev.sh
```

### Production-like Environment

To run a production-like environment locally:

```bash
./deploy_local.sh
```

For more details, see the [Local Deployment Documentation](./docs/local_deployment.md).

## Cloud Deployment

Configurations are provided for various cloud platforms:

- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service
- Heroku
- Digital Ocean App Platform

For detailed instructions, see the [Cloud Deployment Documentation](./docs/cloud_deployment.md).

## CI/CD Pipelines

Example CI/CD pipeline configurations are provided for:

- GitHub Actions (`.github/workflows/ci.yml`)
- GitLab CI (`.gitlab-ci.yml`)
- CircleCI (`.circleci/config.yml`)
- Jenkins (`Jenkinsfile`)

## Monitoring and Logging

Setup includes Prometheus, Grafana, and Fluentd.

For configuration details, see the [Monitoring and Logging Documentation](./docs/monitoring_logging.md).

## Backup and Recovery

Scripts are provided for database and volume backups and restores.

For usage instructions, see the [Backup and Recovery Documentation](./docs/backup_recovery.md).

## Environment Configuration

Environment variables are managed using `.env` files. See the [Environment Configuration Documentation](./docs/environment_configuration.md) and `env_variables.md` for details.

## Docker Configuration

Details about the Dockerfile and Docker Compose setup can be found in the [Docker Configuration Documentation](./docs/docker_configuration.md).

## Scaling

Information about scaling the application can be found in `scaling_configuration.md`.

## Contributing

Please refer to the main Total Recall project repository for contribution guidelines.

## License

Please refer to the main Total Recall project repository for license information.

