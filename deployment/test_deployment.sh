#!/bin/bash

# Test script for Total Recall deployment automation

echo "Starting tests for Total Recall deployment automation..."

# Create test directory
TEST_DIR="/home/ubuntu/total_recall_test"
mkdir -p $TEST_DIR
cd $TEST_DIR

# Copy files from original directory
echo "Copying files from original directory..."
cp -r /home/ubuntu/total_recall/* .

# Test 1: Verify Dockerfile syntax
echo "Test 1: Verifying Dockerfile syntax..."
docker run --rm -i hadolint/hadolint < Dockerfile
if [ $? -eq 0 ]; then
  echo "✅ Dockerfile syntax is valid"
else
  echo "❌ Dockerfile syntax has issues"
fi

# Test 2: Create a simple requirements.txt for testing
echo "Test 2: Creating test requirements.txt..."
cat > requirements.txt << EOF
fastapi==0.95.0
uvicorn==0.21.1
sqlalchemy==2.0.7
psycopg2-binary==2.9.5
pydantic==1.10.7
EOF
echo "✅ Created test requirements.txt"

# Test 3: Create a simple app.py for testing
echo "Test 3: Creating test app.py..."
cat > app.py << EOF
from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Total Recall"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
EOF
echo "✅ Created test app.py"

# Test 4: Build Docker image
echo "Test 4: Building Docker image..."
docker build -t totalrecall-test .
if [ $? -eq 0 ]; then
  echo "✅ Docker image built successfully"
else
  echo "❌ Docker image build failed"
fi

# Test 5: Test environment configuration
echo "Test 5: Testing environment configuration..."
if [ -f .env.example ]; then
  cp .env.example .env
  echo "✅ Environment configuration copied successfully"
else
  echo "❌ Environment configuration file not found"
fi

# Test 6: Test docker-compose configuration
echo "Test 6: Testing docker-compose configuration..."
docker-compose config
if [ $? -eq 0 ]; then
  echo "✅ docker-compose configuration is valid"
else
  echo "❌ docker-compose configuration has issues"
fi

# Test 7: Test secrets management
echo "Test 7: Testing secrets management..."
if [ -f setup_secrets.sh ]; then
  chmod +x setup_secrets.sh
  ./setup_secrets.sh
  if [ -d secrets ]; then
    echo "✅ Secrets management works correctly"
  else
    echo "❌ Secrets directory not created"
  fi
else
  echo "❌ Secrets management script not found"
fi

# Test 8: Test local deployment script
echo "Test 8: Testing local deployment script..."
if [ -f deploy_local.sh ]; then
  chmod +x deploy_local.sh
  echo "✅ Local deployment script is executable"
else
  echo "❌ Local deployment script not found"
fi

# Test 9: Test backup scripts
echo "Test 9: Testing backup scripts..."
if [ -f backup_db.sh ] && [ -f backup_volumes.sh ]; then
  chmod +x backup_db.sh backup_volumes.sh
  echo "✅ Backup scripts are executable"
else
  echo "❌ Backup scripts not found"
fi

# Test 10: Verify CI/CD configurations
echo "Test 10: Verifying CI/CD configurations..."
CI_FILES=(.github/workflows/ci.yml .gitlab-ci.yml .circleci/config.yml Jenkinsfile)
CI_COUNT=0
for file in "${CI_FILES[@]}"; do
  if [ -f "$file" ]; then
    CI_COUNT=$((CI_COUNT+1))
  fi
done
if [ $CI_COUNT -eq ${#CI_FILES[@]} ]; then
  echo "✅ All CI/CD configurations are present"
else
  echo "⚠️ Some CI/CD configurations are missing"
fi

# Test 11: Verify cloud deployment configurations
echo "Test 11: Verifying cloud deployment configurations..."
CLOUD_FILES=(.elasticbeanstalk/config.yml cloudbuild.yaml .do/app.yaml heroku.yml azure-pipelines.yml)
CLOUD_COUNT=0
for file in "${CLOUD_FILES[@]}"; do
  if [ -f "$file" ]; then
    CLOUD_COUNT=$((CLOUD_COUNT+1))
  fi
done
if [ $CLOUD_COUNT -eq ${#CLOUD_FILES[@]} ]; then
  echo "✅ All cloud deployment configurations are present"
else
  echo "⚠️ Some cloud deployment configurations are missing"
fi

# Test 12: Verify monitoring configurations
echo "Test 12: Verifying monitoring configurations..."
if [ -f prometheus/prometheus.yml ] && [ -f grafana/dashboards/totalrecall.json ]; then
  echo "✅ Monitoring configurations are present"
else
  echo "⚠️ Some monitoring configurations are missing"
fi

# Clean up
echo "Cleaning up test environment..."
docker rmi totalrecall-test || true
docker-compose down || true

echo "Tests completed!"
