# 🚀 EchoTune AI Pre-Installation Requirements Guide

This guide outlines the secrets, keys, and configurations you need to prepare **before** running the EchoTune AI deployment.

## 🔑 Required API Keys & Secrets

### 1. Spotify Developer Account (REQUIRED for Production)

**Setup Instructions:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the details:
   - **App Name**: `EchoTune AI - [Your Domain]`
   - **App Description**: `AI-powered music recommendation system`
   - **Redirect URI**: `https://your-domain.com/auth/callback`
   - **Website**: `https://your-domain.com`
5. Save the app and note down:
   - **Client ID** (public)
   - **Client Secret** (keep secret)

**Required Scopes:**
- `user-read-private`
- `user-read-email`
- `user-top-read`
- `user-read-recently-played`
- `playlist-read-private`
- `playlist-read-collaborative`
- `playlist-modify-public`
- `playlist-modify-private`

### 2. Google Gemini API Key (Recommended for AI Features)

**Setup Instructions:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select your Google Cloud project (or create a new one)
5. Copy the generated API key

**Cost**: Free tier includes generous limits for testing

### 3. OpenAI API Key (Alternative to Gemini)

**Setup Instructions:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Give it a name and copy the key immediately

**Cost**: Pay-per-use pricing, requires credit card

### 4. Database Configuration

#### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (Free M0 tier available)
4. Create a database user with read/write permissions
5. Get the connection string: `mongodb+srv://username:password@cluster.mongodb.net/echotune`

#### Option B: Local MongoDB
- The deployment wizard will set up local MongoDB automatically
- Connection string: `mongodb://localhost:27017/echotune`

## 🌐 Domain & DNS Requirements

### Domain Registration
You need a registered domain name pointing to your server's IP address.

**Required DNS Records:**
```
A Record: @ → YOUR_SERVER_IP
A Record: www → YOUR_SERVER_IP
```

**Popular Domain Registrars:**
- [Namecheap](https://namecheap.com)
- [GoDaddy](https://godaddy.com)
- [Cloudflare](https://cloudflare.com)
- [Google Domains](https://domains.google.com)

### Server Requirements

**Minimum Specifications:**
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **Network**: Open ports 80, 443, and 22

**Popular VPS Providers:**
- [DigitalOcean](https://digitalocean.com) - $4-12/month
- [Linode](https://linode.com) - $5-10/month
- [Vultr](https://vultr.com) - $3.50-10/month
- [Hetzner](https://hetzner.com) - €3-10/month

## 📋 Pre-Installation Checklist

Before running the deployment wizard, ensure you have:

### ✅ Essential Information
- [ ] Domain name (e.g., `yourdomain.com`)
- [ ] Server IP address
- [ ] Root/sudo access to Ubuntu 22.04 server

### ✅ Spotify API (Required for Production)
- [ ] Spotify Developer account created
- [ ] Spotify app configured with correct redirect URI
- [ ] Client ID noted down
- [ ] Client Secret noted down

### ✅ AI Provider (Optional but Recommended)
- [ ] Google Gemini API key **OR** OpenAI API key
- [ ] API key tested and working

### ✅ Database (Choose One)
- [ ] MongoDB Atlas connection string **OR**
- [ ] Prepared for local MongoDB installation

### ✅ DNS Configuration
- [ ] Domain DNS points to server IP
- [ ] A records for @ and www configured
- [ ] DNS propagation completed (check with [DNS Checker](https://dnschecker.org/))

## 🔧 Deployment Modes

The wizard supports three deployment modes:

### 1. Production Mode
- **Requirements**: All API keys and secrets required
- **Features**: Full functionality, Spotify integration, AI recommendations
- **Recommended for**: Live production deployments

### 2. Demo Mode  
- **Requirements**: Only domain and server access
- **Features**: Limited functionality, mock data, no external APIs
- **Recommended for**: Testing and evaluation

### 3. Development Mode
- **Requirements**: Variable (can work with minimal setup)
- **Features**: Development tools, debugging enabled, hot reload
- **Recommended for**: Development and testing

## 🚀 Quick Start Commands

Once you have all requirements ready:

### Interactive Wizard (Recommended)
```bash
# Download and run the wizard
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-ubuntu22-wizard.sh | sudo bash
```

### Manual Download and Run
```bash
# Download the wizard
wget https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-ubuntu22-wizard.sh

# Make executable and run
chmod +x deploy-ubuntu22-wizard.sh
sudo ./deploy-ubuntu22-wizard.sh
```

## 🔒 Security Notes

### Protect Your Secrets
- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Generate strong passwords** for database users
- **Enable UFW firewall** (wizard handles this automatically)
- **Keep SSL certificates updated** (auto-renewal configured)

### Recommended Security Practices
1. Create a separate Spotify app for each deployment
2. Use different database credentials for each environment
3. Regularly rotate API keys and secrets
4. Monitor API usage and billing
5. Use fail2ban for intrusion prevention (configured automatically)

## 🆘 Troubleshooting Common Issues

### "DNS_PROBE_FINISHED_NXDOMAIN"
- **Solution**: Check DNS configuration, wait for propagation
- **Check**: Use `nslookup yourdomain.com` to verify DNS

### "Connection Refused" during SSL setup
- **Solution**: Ensure DNS points to correct IP, no firewall blocking port 80
- **Check**: `curl -I http://yourdomain.com`

### "Spotify API Invalid Redirect URI"  
- **Solution**: Update redirect URI in Spotify app settings
- **Format**: `https://yourdomain.com/auth/callback` (exact match required)

### "MongoDB Connection Failed"
- **Solution**: Check connection string, verify network access
- **Test**: Use MongoDB Compass or mongo shell to test connection

### "Python Package Installation Failed"
- **Solution**: The wizard handles Ubuntu 22.04 externally-managed-environment automatically
- **Fix**: Uses virtual environment to avoid system conflicts

## 📞 Support Resources

- **GitHub Issues**: [Report problems](https://github.com/dzp5103/Spotify-echo/issues)
- **Documentation**: [Complete guides](https://github.com/dzp5103/Spotify-echo/tree/main/docs)
- **DNS Configuration**: [Detailed DNS setup guide](docs/deployment/DNS_CONFIGURATION_GUIDE.md)
- **Spotify API**: [Spotify Developer Documentation](https://developer.spotify.com/documentation/)
- **Google Gemini**: [Gemini API Documentation](https://ai.google.dev/docs)

## 🎯 Next Steps

After gathering all requirements:

1. **Run the deployment wizard** with the quick start command above
2. **Follow the interactive prompts** to configure your installation
3. **Verify the deployment** by accessing your domain
4. **Test the health endpoint**: `https://yourdomain.com/health`
5. **Configure additional features** as needed

The wizard will automatically handle:
- ✅ Ubuntu 22.04 compatibility fixes
- ✅ Docker installation with proper configuration
- ✅ Python virtual environment setup
- ✅ SSL certificate generation and auto-renewal
- ✅ Nginx reverse proxy configuration
- ✅ Firewall setup and security hardening
- ✅ Service management and monitoring
- ✅ Environment file generation with your secrets

🎵 **Ready to deploy your AI-powered music platform!**