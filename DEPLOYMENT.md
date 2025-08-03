# 🚀 EchoTune AI - Deployment Guide

## Overview

This deployment guide provides instructions for using the DigitalOcean deployment script (`deploy.sh`) to set up the DigitalOcean CLI and manage droplets for EchoTune AI deployment.

## Prerequisites

- A DigitalOcean account
- A DigitalOcean API token (Personal Access Token)
- Unix-like operating system (Linux, macOS, or WSL on Windows)
- Internet connection for downloading tools

## Getting Started

### 1. DigitalOcean API Token

First, you'll need a DigitalOcean API token:

1. Log in to your [DigitalOcean Control Panel](https://cloud.digitalocean.com/)
2. Go to **API** → **Tokens/Keys**
3. Click **Generate New Token**
4. Give it a name (e.g., "EchoTune Deployment")
5. Select **Full Access** for complete droplet management
6. Copy the generated token (you won't see it again)

### 2. Running the Deployment Script

The `deploy.sh` script provides several options for setup and management:

#### Basic Usage (Interactive)
```bash
./deploy.sh
```

This will:
- Install the DigitalOcean CLI (`doctl`) if not present
- Prompt for your API token
- Authenticate with DigitalOcean
- List your current droplets

#### Using Environment Variable
```bash
export DIGITALOCEAN_API_TOKEN="your_api_token_here"
./deploy.sh
```

#### Using Command Line Token
```bash
./deploy.sh --token your_api_token_here
```

#### Install CLI Only
```bash
./deploy.sh --install-only
```

#### List Droplets Only (if already authenticated)
```bash
./deploy.sh --list-only
```

### 3. Command Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message and usage examples |
| `-t, --token TOKEN` | Specify API token directly |
| `--install-only` | Only install doctl CLI, skip authentication |
| `--list-only` | Only list droplets (assumes already authenticated) |

### 4. Environment Variables

| Variable | Description |
|----------|-------------|
| `DIGITALOCEAN_API_TOKEN` | Your DigitalOcean API token for authentication |

## Security Best Practices

### 1. API Token Security

**🔒 Token Storage:**
- Never commit API tokens to version control
- Use environment variables for automation
- Store tokens in secure password managers
- Rotate tokens regularly (every 90 days recommended)

**Environment Variable Setup:**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export DIGITALOCEAN_API_TOKEN="your_secure_token_here"
```

**For CI/CD Systems:**
- Use encrypted environment variables
- Limit token permissions to minimum required
- Use separate tokens for different environments

### 2. Network Security

**Firewall Configuration:**
```bash
# After creating droplets, configure firewall rules
doctl compute firewall create echotune-firewall \
  --inbound-rules "protocol:tcp,ports:22,sources:your_ip_address" \
  --inbound-rules "protocol:tcp,ports:80,sources:0.0.0.0/0,::/0" \
  --inbound-rules "protocol:tcp,ports:443,sources:0.0.0.0/0,::/0"
```

**SSH Key Management:**
```bash
# Add your SSH key to DigitalOcean
doctl compute ssh-key create my-key --public-key-file ~/.ssh/id_rsa.pub
```

### 3. Access Control

**User Management:**
- Use non-root users for application deployment
- Configure sudo access appropriately
- Disable root login via SSH
- Use SSH keys instead of passwords

**Token Permissions:**
- Use read-only tokens when possible
- Create separate tokens for different purposes
- Monitor token usage in DigitalOcean dashboard

### 4. Monitoring and Auditing

**Enable Monitoring:**
```bash
# Enable monitoring when creating droplets
doctl compute droplet create mydroplet \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc3 \
  --enable-monitoring
```

**Regular Security Checks:**
- Review droplet access logs
- Monitor for unauthorized API usage
- Keep DigitalOcean CLI updated
- Audit firewall rules regularly

## Common Use Cases

### 1. Creating a New Droplet for EchoTune AI

```bash
# Create a production-ready droplet
doctl compute droplet create echotune-prod \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --enable-monitoring \
  --enable-backups \
  --ssh-keys your_ssh_key_id
```

### 2. Listing Available Resources

```bash
# List available images
doctl compute image list --public

# List available sizes
doctl compute size list

# List available regions
doctl compute region list
```

### 3. Managing Existing Droplets

```bash
# Get droplet details
doctl compute droplet get droplet_id

# Power cycle a droplet
doctl compute droplet-action power-cycle droplet_id

# Create a snapshot
doctl compute droplet-action snapshot droplet_id --snapshot-name "backup-$(date +%Y%m%d)"
```

## Troubleshooting

### 1. Installation Issues

**Problem:** Permission denied when installing doctl
```bash
# Solution: Install to user directory
mkdir -p ~/.local/bin
# The script will automatically use this if /usr/local/bin is not writable
```

**Problem:** doctl not found after installation
```bash
# Solution: Add to PATH
export PATH="$HOME/.local/bin:$PATH"
# Add this line to your shell profile for permanent effect
```

### 2. Authentication Issues

**Problem:** Invalid API token
- Verify token is copied correctly (no extra spaces)
- Check token hasn't expired
- Ensure token has correct permissions

**Problem:** Network connectivity issues
```bash
# Test connectivity
curl -s https://api.digitalocean.com/v2/account \
  -H "Authorization: Bearer your_token_here"
```

### 3. Permission Issues

**Problem:** Cannot create droplets
- Verify API token has write permissions
- Check account billing status
- Ensure sufficient account limits

## Integration with EchoTune AI

Once you have doctl set up and droplets created, you can proceed with EchoTune AI deployment using the comprehensive deployment scripts:

### 1. Full Production Deployment
```bash
# Use the comprehensive deployment script
./scripts/deploy.sh
```

### 2. One-Click Deployment
```bash
# Use the one-click deployment option
./deploy-one-click.sh
```

### 3. Manual Deployment
Follow the detailed instructions in [`DIGITALOCEAN_DEPLOYMENT.md`](./DIGITALOCEAN_DEPLOYMENT.md) for complete setup.

## Additional Resources

### Documentation
- [DigitalOcean CLI Documentation](https://docs.digitalocean.com/reference/doctl/)
- [DigitalOcean API Documentation](https://docs.digitalocean.com/reference/api/)
- [EchoTune AI Complete Deployment Guide](./DIGITALOCEAN_DEPLOYMENT.md)

### Security Resources
- [DigitalOcean Security Best Practices](https://docs.digitalocean.com/products/platform/security/)
- [SSH Key Management](https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/)
- [Cloud Firewall Setup](https://docs.digitalocean.com/products/networking/firewalls/)

### Support
- **Technical Issues:** Create an issue in this repository
- **DigitalOcean Support:** [Support Center](https://docs.digitalocean.com/support/)
- **Community:** [DigitalOcean Community](https://www.digitalocean.com/community)

## Example Workflow

Here's a complete workflow for deploying EchoTune AI:

```bash
# 1. Set up DigitalOcean CLI
export DIGITALOCEAN_API_TOKEN="your_token_here"
./deploy.sh

# 2. Create a droplet for production
doctl compute droplet create echotune-prod \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --enable-monitoring \
  --enable-backups \
  --ssh-keys your_ssh_key_id

# 3. Get the droplet IP
doctl compute droplet list

# 4. Deploy EchoTune AI to the droplet
# SSH to droplet and run the comprehensive deployment script
ssh root@droplet_ip "curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/setup-digitalocean.sh | bash"
```

## Security Checklist

Before deploying to production, ensure:

- [ ] API tokens are stored securely
- [ ] SSH keys are configured properly
- [ ] Firewall rules are restrictive
- [ ] Monitoring is enabled
- [ ] Backups are configured
- [ ] Non-root users are created
- [ ] Automatic security updates are enabled
- [ ] SSL certificates are configured
- [ ] Domain DNS is properly configured
- [ ] Application secrets are secured

---

**Next Steps:** Once your DigitalOcean environment is set up, proceed to the comprehensive deployment guide in [`DIGITALOCEAN_DEPLOYMENT.md`](./DIGITALOCEAN_DEPLOYMENT.md) for complete EchoTune AI deployment.