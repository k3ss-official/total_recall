# Installation Guide

This guide provides instructions for installing and running the Total Recall application using either Docker or a Conda environment.

## Prerequisites

- Git
- One of the following:
  - Docker and Docker Compose (for Docker installation)
  - Conda/Miniconda (for Conda installation)
- Node.js 16+ and npm (for local development)

## Option 1: Docker Installation

Docker provides the easiest way to get started with Total Recall, as it packages all dependencies and configurations in containers.

### Step 1: Clone the Repository

```bash
git clone https://github.com/k3ss-official/Total-Recall.git
cd Total-Recall
git checkout k3ss
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file to configure your settings if needed.

### Step 3: Build and Start the Containers

```bash
./install_docker.sh
```

This script will:
1. Check for Docker and Docker Compose
2. Build the Docker images
3. Start the containers
4. Initialize the database if needed

### Step 4: Access the Application

Once the containers are running, you can access the application at:

```
http://localhost:8000
```

### Stopping the Application

To stop the application:

```bash
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

## Option 2: Conda Installation

Conda installation is recommended for development or if you prefer not to use Docker.

### Step 1: Clone the Repository

```bash
git clone https://github.com/k3ss-official/Total-Recall.git
cd Total-Recall
git checkout k3ss
```

### Step 2: Create and Activate Conda Environment

```bash
./install_conda.sh
```

This script will:
1. Check for Conda
2. Create a new environment using the environment.yml file
3. Activate the environment
4. Install all dependencies

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file to configure your settings if needed.

### Step 4: Start the Application

Start the backend:

```bash
cd api
npm start
```

In a new terminal, start the frontend:

```bash
cd frontend
npm start
```

### Step 5: Access the Application

Once both services are running, you can access the application at:

```
http://localhost:3000
```

## Development Setup

For development, you'll want to run the services separately with hot reloading.

### Backend Development

```bash
cd api
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### Docker Issues

1. **Port conflicts**: If port 8000 is already in use, edit the `docker-compose.yml` file to map to a different port.

2. **Permission issues**: You might need to run Docker commands with `sudo` depending on your setup.

3. **Container not starting**: Check logs with `docker-compose logs`.

### Conda Issues

1. **Conda not found**: Make sure Conda is in your PATH.

2. **Dependency conflicts**: Try creating a fresh environment with `conda create -n total-recall python=3.10` and then install dependencies manually.

3. **Node.js errors**: Ensure you have Node.js 16+ installed.

### Application Issues

1. **API connection errors**: Check that both frontend and backend are running and the API URL is correctly configured.

2. **Authentication failures**: Ensure your ChatGPT credentials are correct and your account doesn't have additional security measures like CAPTCHA or two-factor authentication.

3. **Browser compatibility**: The application is tested on Chrome, Firefox, and Edge. Other browsers may have issues.

## Next Steps

After installation, refer to the User Guide for instructions on how to use the application.
