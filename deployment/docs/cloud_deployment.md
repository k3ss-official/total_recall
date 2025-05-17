# Cloud Deployment Documentation

This document provides detailed information about cloud deployment options for the Total Recall project.

## Supported Cloud Platforms

The Total Recall project includes deployment configurations for the following cloud platforms:

1. AWS Elastic Beanstalk
2. Google Cloud Run
3. Azure App Service
4. Heroku
5. Digital Ocean App Platform

## AWS Elastic Beanstalk

AWS Elastic Beanstalk is a fully managed service that makes it easy to deploy and run applications in multiple languages.

### Configuration

The AWS Elastic Beanstalk configuration is located in the `.elasticbeanstalk/config.yml` file:

```yaml
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

### Deployment Steps

1. Install the AWS CLI and EB CLI:
   ```bash
   pip install awscli awsebcli
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Initialize the EB CLI (if not already done):
   ```bash
   eb init
   ```

4. Create an environment (if not already done):
   ```bash
   eb create totalrecall-prod
   ```

5. Deploy the application:
   ```bash
   eb deploy
   ```

6. Open the application in a browser:
   ```bash
   eb open
   ```

## Google Cloud Run

Google Cloud Run is a fully managed platform for containerized applications.

### Configuration

The Google Cloud Run configuration is located in the `cloudbuild.yaml` file:

```yaml
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

### Deployment Steps

1. Install the Google Cloud SDK:
   ```bash
   # Follow instructions at https://cloud.google.com/sdk/docs/install
   ```

2. Initialize the Google Cloud SDK:
   ```bash
   gcloud init
   ```

3. Set the project ID:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
   ```

5. Deploy using Cloud Build:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

## Azure App Service

Azure App Service is a fully managed platform for building, deploying, and scaling web apps.

### Configuration

The Azure App Service configuration is located in the `azure-pipelines.yml` file:

```yaml
trigger:
- main

resources:
  repositories:
    self:
      clean: true

stages:
- stage: Build
  jobs:
  - job: BuildJob
    steps:
    - task: Docker@2
      inputs:
        containerRegistry: 'dockerRegistry'
        repository: 'totalrecall'
        command: 'buildAndPush'
        Dockerfile: '**/Dockerfile'

- stage: Deploy
  jobs:
  - job: DeployJob
    steps:
    - task: AzureWebAppContainer@1
      inputs:
        azureSubscription: '$(azureSubscription)'
        appName: 'totalrecall'
        imageName: '$(dockerRegistry)/totalrecall:$(Build.BuildId)'
```

### Deployment Steps

1. Install the Azure CLI:
   ```bash
   # Follow instructions at https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   ```

2. Log in to Azure:
   ```bash
   az login
   ```

3. Create a resource group (if not already done):
   ```bash
   az group create --name totalrecall-rg --location eastus
   ```

4. Create an App Service plan (if not already done):
   ```bash
   az appservice plan create --name totalrecall-plan --resource-group totalrecall-rg --sku B1 --is-linux
   ```

5. Create a Web App for Containers:
   ```bash
   az webapp create --resource-group totalrecall-rg --plan totalrecall-plan --name totalrecall --deployment-container-image-name username/totalrecall:latest
   ```

6. Configure environment variables:
   ```bash
   az webapp config appsettings set --resource-group totalrecall-rg --name totalrecall --settings DEBUG=false LOG_LEVEL=INFO
   ```

## Heroku

Heroku is a platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.

### Configuration

The Heroku configuration is located in the `heroku.yml` file:

```yaml
build:
  docker:
    web: Dockerfile
```

### Deployment Steps

1. Install the Heroku CLI:
   ```bash
   # Follow instructions at https://devcenter.heroku.com/articles/heroku-cli
   ```

2. Log in to Heroku:
   ```bash
   heroku login
   ```

3. Create a Heroku app (if not already done):
   ```bash
   heroku create totalrecall
   ```

4. Set up the Heroku container registry:
   ```bash
   heroku container:login
   ```

5. Deploy the application:
   ```bash
   heroku container:push web
   heroku container:release web
   ```

6. Open the application in a browser:
   ```bash
   heroku open
   ```

## Digital Ocean App Platform

Digital Ocean App Platform is a Platform as a Service (PaaS) offering that allows developers to publish code directly to Digital Ocean without worrying about the underlying infrastructure.

### Configuration

The Digital Ocean App Platform configuration is located in the `.do/app.yaml` file:

```yaml
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

### Deployment Steps

1. Install the Digital Ocean CLI:
   ```bash
   # Follow instructions at https://docs.digitalocean.com/reference/doctl/how-to/install/
   ```

2. Log in to Digital Ocean:
   ```bash
   doctl auth init
   ```

3. Create an app:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

4. Get the app URL:
   ```bash
   doctl apps list
   ```

## Environment Variables

When deploying to cloud platforms, you need to set environment variables for your application. Here's how to do it for each platform:

### AWS Elastic Beanstalk

```bash
eb setenv DEBUG=false LOG_LEVEL=INFO DB_HOST=your-db-host DB_PASSWORD=your-db-password
```

### Google Cloud Run

```bash
gcloud run services update totalrecall --set-env-vars DEBUG=false,LOG_LEVEL=INFO,DB_HOST=your-db-host,DB_PASSWORD=your-db-password
```

### Azure App Service

```bash
az webapp config appsettings set --resource-group totalrecall-rg --name totalrecall --settings DEBUG=false LOG_LEVEL=INFO DB_HOST=your-db-host DB_PASSWORD=your-db-password
```

### Heroku

```bash
heroku config:set DEBUG=false LOG_LEVEL=INFO DB_HOST=your-db-host DB_PASSWORD=your-db-password
```

### Digital Ocean App Platform

Environment variables are set in the `.do/app.yaml` file or through the Digital Ocean console.

## Secrets Management

For managing secrets in cloud environments, use the cloud provider's secrets management service:

- AWS: AWS Secrets Manager or Parameter Store
- GCP: Secret Manager
- Azure: Key Vault
- Heroku: Config Vars
- Digital Ocean: App Platform Environment Variables

## Best Practices

1. **Use environment-specific configurations** for different cloud platforms
2. **Never commit sensitive information** to version control
3. **Use the cloud provider's secrets management service** for sensitive information
4. **Set up monitoring and logging** for your cloud deployment
5. **Configure auto-scaling** for production environments
6. **Set up a CI/CD pipeline** for automated deployments

## Troubleshooting

### Common Issues

1. **Deployment failures**:
   - Check the deployment logs for error messages
   - Verify that the Dockerfile builds successfully locally
   - Ensure all required environment variables are set

2. **Application crashes**:
   - Check the application logs for error messages
   - Verify that the application works locally
   - Ensure the database connection is configured correctly

3. **Performance issues**:
   - Monitor resource usage (CPU, memory, disk)
   - Consider scaling up or out
   - Optimize database queries and application code
