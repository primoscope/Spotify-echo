# DNS Configuration Guide for EchoTune AI

## Required DNS Settings for Multiple Servers

When deploying EchoTune AI on multiple Ubuntu servers with different domains and IP addresses, you need to properly configure DNS settings for each deployment.

## 1. Basic DNS Configuration

### For each server deployment, configure these DNS records:

#### A Record (Root Domain)
- **Name**: `@` or leave empty (for root domain)
- **Type**: `A`
- **Value**: `YOUR_SERVER_IP_ADDRESS`
- **TTL**: `300` (5 minutes for initial setup, can increase to 3600 later)

#### A Record (WWW Subdomain)
- **Name**: `www`
- **Type**: `A` 
- **Value**: `YOUR_SERVER_IP_ADDRESS`
- **TTL**: `300` (5 minutes for initial setup)

## 2. Multiple Server Configuration

### Server 1 Example:
- **Domain**: `echotune1.example.com`
- **IP**: `123.456.789.10`
- **DNS Records**:
  ```
  @ A 123.456.789.10
  www A 123.456.789.10
  ```

### Server 2 Example:
- **Domain**: `echotune2.example.com`
- **IP**: `123.456.789.11`
- **DNS Records**:
  ```
  @ A 123.456.789.11
  www A 123.456.789.11
  ```

## 3. Popular DNS Providers Configuration

### Cloudflare
1. Log into Cloudflare dashboard
2. Select your domain
3. Go to DNS settings
4. Add A record:
   - Name: `@`
   - IPv4 address: `YOUR_SERVER_IP`
   - Proxy status: DNS only (orange cloud OFF for initial setup)
5. Add WWW A record:
   - Name: `www`
   - IPv4 address: `YOUR_SERVER_IP`
   - Proxy status: DNS only

### Namecheap
1. Log into Namecheap account
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add A Record:
   - Host: `@`
   - Value: `YOUR_SERVER_IP`
   - TTL: Automatic
5. Add WWW A Record:
   - Host: `www`
   - Value: `YOUR_SERVER_IP`
   - TTL: Automatic

### GoDaddy
1. Log into GoDaddy account
2. My Products → DNS
3. Add A record:
   - Name: `@`
   - Value: `YOUR_SERVER_IP`
   - TTL: 600
4. Add A record:
   - Name: `www`
   - Value: `YOUR_SERVER_IP`
   - TTL: 600

### Google Domains
1. Log into Google Domains
2. Select your domain → DNS
3. Custom resource records
4. Add A record:
   - Name: `@`
   - Type: `A`
   - TTL: `300`
   - Data: `YOUR_SERVER_IP`
5. Add A record:
   - Name: `www`
   - Type: `A`
   - TTL: `300`
   - Data: `YOUR_SERVER_IP`

## 4. DNS Validation Commands

After configuring DNS, validate the setup:

### Check A Record Resolution
```bash
# Check root domain
nslookup yourdomain.com
dig yourdomain.com A

# Check www subdomain
nslookup www.yourdomain.com
dig www.yourdomain.com A
```

### Check Global DNS Propagation
```bash
# Check from multiple locations
dig @8.8.8.8 yourdomain.com A
dig @1.1.1.1 yourdomain.com A
dig @208.67.222.222 yourdomain.com A
```

### Online DNS Checking Tools
- **DNS Checker**: https://dnschecker.org/
- **DNS Propagation**: https://www.whatsmydns.net/
- **MX Toolbox**: https://mxtoolbox.com/SuperTool.aspx

## 5. SSL Certificate Considerations

### Let's Encrypt Requirements
For automated SSL certificate generation, ensure:

1. **DNS propagation is complete** (usually 5-15 minutes)
2. **Port 80 is accessible** from the internet
3. **No existing web server** is running on port 80 during certificate generation
4. **Domain points to correct IP** before running certificate generation

### Verify DNS Before SSL
```bash
# Test HTTP access (before SSL setup)
curl -I http://yourdomain.com
wget --spider http://yourdomain.com
```

## 6. Troubleshooting DNS Issues

### Common Issues and Solutions

#### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution**: 
- Verify A record is configured correctly
- Check TTL hasn't expired
- Wait for DNS propagation (up to 48 hours)

#### Issue: "SSL Certificate Generation Failed"
**Solution**:
- Ensure DNS is properly configured and propagated
- Check that port 80 is open and accessible
- Verify no other web server is running

#### Issue: "Site loads but shows wrong content"
**Solution**:
- Check that each server has unique domain configuration
- Verify `.env` file has correct `DOMAIN` setting
- Ensure nginx configuration uses correct domain

### DNS Propagation Time
- **Typical time**: 5-15 minutes
- **Maximum time**: 48 hours
- **TTL setting**: Lower TTL (300) for faster changes during setup

## 7. Multi-Server Deployment Best Practices

### Unique Configuration Per Server
Each server deployment should have:

1. **Unique domain name**
2. **Unique IP address**
3. **Unique SSL certificates**
4. **Separate database** (if using local MongoDB)
5. **Unique API credentials** (if applicable)

### Environment Variables Per Server
Ensure each server has unique `.env` configuration:

```bash
# Server 1
DOMAIN=server1.yourdomain.com
PRIMARY_IP=123.456.789.10
SPOTIFY_REDIRECT_URI=https://server1.yourdomain.com/auth/callback

# Server 2
DOMAIN=server2.yourdomain.com
PRIMARY_IP=123.456.789.11
SPOTIFY_REDIRECT_URI=https://server2.yourdomain.com/auth/callback
```

### Spotify App Configuration
For production deployments with Spotify API:

1. Create separate Spotify apps for each domain
2. Configure redirect URIs for each domain:
   - `https://server1.yourdomain.com/auth/callback`
   - `https://server2.yourdomain.com/auth/callback`
3. Use unique Client ID/Secret for each server

## 8. Verification Checklist

Before considering DNS setup complete:

- [ ] A record points to correct IP address
- [ ] WWW record points to correct IP address
- [ ] DNS propagation is complete (check with online tools)
- [ ] HTTP access works: `curl -I http://yourdomain.com`
- [ ] Each server has unique domain configuration
- [ ] SSL certificates generate successfully
- [ ] HTTPS access works: `curl -I https://yourdomain.com`
- [ ] Health check passes: `curl https://yourdomain.com/health`

## 9. Post-Deployment DNS Updates

After successful deployment, you may want to:

1. **Increase TTL** to 3600 (1 hour) or 86400 (24 hours) for better performance
2. **Enable Cloudflare proxy** (if using Cloudflare) for additional protection
3. **Add CNAME records** for additional subdomains if needed
4. **Configure MX records** if email functionality is required

This DNS configuration ensures each EchoTune AI server deployment has proper domain resolution and SSL certificate support.