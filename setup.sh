#!/bin/bash

echo "====================================================="
echo "        Total Recall Setup Script"
echo "====================================================="

# Check for conda installation
if ! command -v conda &> /dev/null; then
    echo "Error: Conda is not installed or not in your PATH."
    echo "Please install Miniconda or Anaconda, then re-run this script."
    exit 1
fi

echo
echo "Conda detected."

# Ask user if they want to create a new environment
read -p "Would you like to create a new conda environment? (y/n): " create_env

if [[ "$create_env" =~ ^[Yy]$ ]]; then
    env_name="total_recall"
    echo "Creating new conda environment '$env_name' with Python 3.12..."
    conda create -y -n "$env_name" python=3.12
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create environment."
        exit 1
    fi
else
    read -p "Enter the name of your existing conda environment: " env_name
fi

# Initialize conda for the script session
eval "$(conda shell.bash hook)"

# Activate the environment
echo "Activating conda environment '$env_name'..."
conda activate "$env_name"
if [ $? -ne 0 ]; then
    echo "Error: Could not activate environment '$env_name'."
    exit 1
fi

echo
echo "Environment '$env_name' is now active."
echo "Python version: $(python --version)"
echo

# Confirm before installing requirements
read -p "Ready to install dependencies from requirements.txt in this environment? (y/n): " proceed
if [[ ! "$proceed" =~ ^[Yy]$ ]]; then
    echo "Aborting installation as requested."
    exit 0
fi

# Install requirements
if [ ! -f requirements.txt ]; then
    echo "Error: requirements.txt file not found in the current directory."
    exit 1
fi

echo "Installing dependencies..."
pip install --upgrade pip
pip install --force-reinstall --no-cache-dir -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    exit 1
fi

echo
echo "====================================================="
echo "      Total Recall setup completed successfully!"
echo "====================================================="
echo
echo "Next steps:"
echo "1. Whenever you want to use this tool, activate the environment:"
echo "      conda activate $env_name"
echo "2. Run the application as described in the README or documentation."
echo
echo "Thank you for using Total Recall!"
echo

exit 0

