# 🚀 Vercel Deployment Guide for EchoTune AI

## Overview
This guide covers deploying EchoTune AI to Vercel with proper environment variable configuration and production optimization.

## Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- Vercel account and project created
- Environment variables configured

## 🏗️ Project Structure
```
/
├── api/                    # Vercel serverless functions
│   ├── index.js           # Main API entry point
│   └── health.js          # Health check endpoint
├── src/                    # Source code
│   ├── frontend/          # React frontend
│   └── api/               # API routes and logic
├── vercel.json            # Vercel configuration
├── .vercelignore          # Files to exclude from deployment
└── package.json           # Dependencies and scripts
```

## 🔧 Environment Variables Setup

### 1. Required Environment Variables
Set these in your Vercel project dashboard under Settings > Environment Variables:

#### Core Configuration
```bash
NODE_ENV=production
PORT=3000
DOMAIN=your-domain.vercel.app
FRONTEND_URL=https://your-domain.vercel.app
```

#### Security
```bash
JWT_SECRET=your_32_character_jwt_secret_here
SESSION_SECRET=your_32_character_session_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

#### Spotify API (Required)
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.vercel.app/auth/callback
```

#### Database (Required)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune?retryWrites=true&w=majority
REDIS_URL=redis://username:password@redis-host:port
```

#### AI/LLM Providers (Optional)
```bash
OPENAI_API_KEY=sk-your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

#### Additional Services (Optional)
```bash
SENTRY_DSN=your_sentry_dsn
AGENTOPS_API_KEY=your_agentops_api_key
BROWSERBASE_API_KEY=your_browserbase_api_key
```

### 2. Environment Variable Groups
Create environment variable groups for different environments:

#### Production
- All required variables with production values
- `NODE_ENV=production`
- Production database URLs

#### Preview
- Same as production but with test values
- `NODE_ENV=staging`
- Test database URLs

#### Development
- Local development values
- `NODE_ENV=development`
- Local database URLs

## 🚀 Deployment Steps

### 1. Initial Setup
```bash
# Login to Vercel
vercel login

# Link to existing project (if applicable)
vercel link

# Or create new project
vercel
```

### 2. Environment Variables
```bash
# Set environment variables
vercel env add MONGODB_URI production
vercel env add SPOTIFY_CLIENT_ID production
vercel env add SPOTIFY_CLIENT_SECRET production
# ... add all required variables
```

### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Environment Variable "MONGODB_URI" references Secret "mongodb_uri", which does not exist
**Solution**: Set the environment variable directly in Vercel dashboard:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add `MONGODB_URI` with your MongoDB connection string
4. Set the environment (Production, Preview, Development)

#### 2. Build Failures
**Solution**: Check build logs and ensure:
- All dependencies are in `package.json`
- Build script is correct: `"build": "vite build"`
- Node.js version is compatible (20.x)

#### 3. API Routes Not Working
**Solution**: Verify API structure:
- API functions are in `/api` directory
- Functions export properly for Vercel
- Routes are configured in `vercel.json`

#### 4. CORS Issues
**Solution**: Update CORS configuration:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.vercel.app'],
  credentials: true
}));
```

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance metrics
- Track user behavior

### 2. Health Checks
- Use `/api/health` endpoint for monitoring
- Set up uptime monitoring
- Monitor API response times

### 3. Error Tracking
- Integrate Sentry for error monitoring
- Set up Vercel function logs
- Monitor build and deployment success rates

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use Vercel's built-in secret management
- Rotate secrets regularly

### 2. API Security
- Implement rate limiting
- Use HTTPS only
- Validate all inputs
- Implement proper authentication

### 3. CORS Configuration
- Restrict origins to trusted domains
- Limit allowed methods and headers
- Use credentials carefully

## 🚀 Performance Optimization

### 1. Build Optimization
- Use `.vercelignore` to exclude unnecessary files
- Optimize bundle size with Vite
- Implement code splitting

### 2. API Optimization
- Use serverless functions efficiently
- Implement caching strategies
- Optimize database queries

### 3. Frontend Optimization
- Implement lazy loading
- Use CDN for static assets
- Optimize images and media

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] API endpoints working
- [ ] Frontend building successfully
- [ ] CORS configured correctly
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Health checks working
- [ ] Monitoring set up
- [ ] SSL/HTTPS enabled
- [ ] Performance optimized
- [ ] Error handling implemented

## 🔄 Continuous Deployment

### 1. GitHub Integration
- Connect GitHub repository
- Enable automatic deployments
- Set up branch protection rules

### 2. Environment Promotion
- Deploy to preview on PR
- Promote to production on merge
- Use environment-specific configurations

### 3. Rollback Strategy
- Keep previous deployments
- Implement quick rollback
- Monitor deployment health

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with production config
4. Check Vercel status page
5. Contact Vercel support if needed

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Deployment](https://vercel.com/docs/deployments)