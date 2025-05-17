#!/bin/bash

# Total Recall Setup Script
# This script sets up the Total Recall environment and installs dependencies

# Display welcome message
echo "====================================================="
echo "  Total Recall Setup"
echo "  Developed by k3ss, Rae(4o) and manus"
echo "====================================================="
echo ""

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Conda is not installed. Please install Conda first."
    echo "Visit https://docs.conda.io/en/latest/miniconda.html for installation instructions."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "src" ]; then
    echo "Error: This script must be run from the Total Recall project root directory."
    echo "Please navigate to the project root and try again."
    exit 1
fi

# Ask if user wants to create a new conda environment
read -p "Do you want to create a new conda environment? (y/n): " create_env

if [ "$create_env" = "y" ] || [ "$create_env" = "Y" ]; then
    # Create new environment with Python 3.12
    echo "Creating new conda environment 'total_recall' with Python 3.12..."
    conda create -n total_recall python=3.12 -y
    
    # Activate the environment
    echo "Activating 'total_recall' environment..."
    eval "$(conda shell.bash hook)"
    conda activate total_recall
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to activate conda environment."
        echo "Please try activating manually with: conda activate total_recall"
        exit 1
    fi
else
    # Use existing environment
    read -p "Enter the name of your existing conda environment: " env_name
    
    # Activate the environment
    echo "Activating '$env_name' environment..."
    eval "$(conda shell.bash hook)"
    conda activate $env_name
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to activate conda environment."
        echo "Please check if the environment exists and try again."
        exit 1
    fi
    
    # Check Python version
    python_version=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    if (( $(echo "$python_version < 3.9" | bc -l) )); then
        echo "Warning: Total Recall requires Python 3.9 or newer."
        echo "Current Python version: $python_version"
        read -p "Continue anyway? (y/n): " continue_anyway
        if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
            echo "Setup aborted. Please use an environment with Python 3.9 or newer."
            exit 1
        fi
    fi
fi

# Install dependencies with force-reinstall and no-cache flags
echo "Installing dependencies..."
pip install --force-reinstall --no-cache-dir -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    echo "Please check the error messages above and try again."
    exit 1
fi

# Verify installation
echo "Verifying installation..."
python -m src.cli.token_debugger --help > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Installation verification failed."
    echo "Please check the error messages and try again."
    exit 1
fi

# Success message
echo ""
echo "====================================================="
echo "  Total Recall setup completed successfully!"
echo "====================================================="
echo ""
echo "You can now use the Total Recall CLI tools:"
echo "  python -m src.cli.token_debugger --help"
echo "  python -m src.cli.endpoint_tester --help"
echo "  python -m src.cli.chunker_engine --help"
echo "  python -m src.cli.recall_tester --help"
echo ""
echo "For more information, see the README.md file."
echo ""
echo "Remember to activate your conda environment before using Total Recall:"
if [ "$create_env" = "y" ] || [ "$create_env" = "Y" ]; then
    echo "  conda activate total_recall"
else
    echo "  conda activate $env_name"
fi
echo ""
