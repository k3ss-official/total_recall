#!/bin/bash

# Install script for Total Recall using conda environment
# This script sets up the Total Recall application using conda

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Conda is not installed. Please install Miniconda or Anaconda first."
    echo "Visit https://docs.conda.io/en/latest/miniconda.html for installation instructions."
    exit 1
fi

# Create conda environment from environment.yml
echo "Creating conda environment for Total Recall..."
conda env create -f environment.yml

# Activate the environment
echo "Activating conda environment..."
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate total-recall

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

# Set up configuration
echo "Setting up configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template. Please edit it with your configuration."
fi

echo "Installation complete!"
echo "To start the application:"
echo "1. Activate the conda environment: conda activate total-recall"
echo "2. Run the application: python run.py"
echo "3. Access the application at http://localhost:8000"
