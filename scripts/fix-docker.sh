#!/usr/bin/env bash

set -e

log() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

# Check for root
if [ "$EUID" -ne 0 ]; then
  if command -v sudo &>/dev/null; then
    log "Re-running with sudo..."
    exec sudo "$0" "$@"
  else
    error "This script must be run as root or with sudo."
    exit 1
  fi
fi

# Check/Install Docker
if ! command -v docker &>/dev/null; then
  log "Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  log "Docker installed."
else
  log "Docker is already installed."
fi

# Check/Install Docker Compose (standalone if not a plugin)
if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
  log "Docker Compose not found. Installing standalone Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  log "Docker Compose installed."
else
  log "Docker Compose is already available."
fi

# Start and enable Docker service
if ! systemctl is-active --quiet docker; then
  log "Starting Docker service..."
  systemctl start docker
  systemctl enable docker
  log "Docker service started and enabled."
fi

# Add user to docker group
TARGET_USER="${SUDO_USER:-$USER}"
if ! groups "$TARGET_USER" | grep -qw docker; then
  log "Adding $TARGET_USER to docker group..."
  usermod -aG docker "$TARGET_USER"
  log "You may need to log out and back in for group changes to take effect."
fi

# Fix Docker socket permissions if necessary
if [ -S /var/run/docker.sock ]; then
  chmod 666 /var/run/docker.sock
  log "Fixed Docker socket permissions."
fi

log "Docker installation and configuration is complete."