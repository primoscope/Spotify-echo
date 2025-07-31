#!/bin/bash

# EchoTune AI - Digital Ocean Deployment Script
# This script sets up the application on a Digital Ocean droplet

set -e

echo "🎵 EchoTune AI - Digital Ocean Deployment"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "❌ Please do not run as root"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install nginx (for Let's Encrypt setup)
echo "🌐 Installing nginx..."
sudo apt install -y nginx certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/echotune
sudo chown $USER:$USER /opt/echotune
cd /opt/echotune

# Clone repository (update with your repo URL)
echo "📥 Cloning repository..."
if [ ! -d ".git" ]; then
    git clone https://github.com/dzp5103/Spotify-echo.git .
fi

# Setup environment variables
echo "⚙️ Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "🔑 Please edit .env file with your actual Spotify credentials:"
    echo "   nano .env"
    echo ""
    echo "You need to set:"
    echo "   SPOTIFY_CLIENT_ID=your_actual_client_id"
    echo "   SPOTIFY_CLIENT_SECRET=your_actual_client_secret"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Setup SSL certificates
echo "🔒 Setting up SSL certificates..."
sudo mkdir -p /opt/echotune/ssl

echo ""
echo "🎯 Next steps:"
echo "1. Update your domain DNS to point to this server's IP"
echo "2. Run: sudo certbot --nginx -d primosphere.studio -d www.primosphere.studio"
echo "3. Copy the generated certificates to /opt/echotune/ssl/"
echo "4. Run: ./deploy.sh to start the application"
echo ""

echo "✅ Basic setup complete!"
echo "🔗 Repository cloned to: /opt/echotune"