#!/bin/bash

# Create secrets directory if it doesn't exist
mkdir -p secrets

# Function to generate a random password
generate_password() {
  openssl rand -base64 16
}

# Function to create a secret file
create_secret() {
  local secret_name=$1
  local secret_value=$2
  local secret_file="secrets/${secret_name}.txt"
  
  echo "Creating secret: ${secret_name}"
  echo "${secret_value}" > "${secret_file}"
  chmod 600 "${secret_file}"
}

# Create database password secret for production
if [ ! -f "secrets/db_password.txt" ]; then
  DB_PASSWORD=$(generate_password)
  create_secret "db_password" "${DB_PASSWORD}"
  echo "Database password secret created."
else
  echo "Database password secret already exists."
fi

# Create a README file for the secrets directory
cat > secrets/README.md << EOF
# Secrets Management

This directory contains secret files used by the Total Recall application.

## Files

- \`db_password.txt\`: PostgreSQL database password

## Security Notes

- These files should never be committed to version control
- In production environments, consider using a dedicated secrets management solution
- For cloud deployments, use the cloud provider's secrets management service:
  - AWS: AWS Secrets Manager or Parameter Store
  - GCP: Secret Manager
  - Azure: Key Vault
  - Heroku: Config Vars
  - Digital Ocean: App Platform Environment Variables

## Usage

Secrets are mounted into containers using Docker secrets in production.
EOF

echo "Secrets management setup complete."
