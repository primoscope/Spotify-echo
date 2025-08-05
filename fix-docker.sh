#!/bin/bash

# Robust Docker Install and Repair Script

# Function to install Docker
install_docker() {
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
}

# Function to repair Docker installation
repair_docker() {
    echo "Repairing Docker installation..."
    sudo systemctl restart docker
    sudo systemctl status docker
}

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    install_docker
else
    echo "Docker is already installed."
    repair_docker
}

