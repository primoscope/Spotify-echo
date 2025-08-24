# 🚀 Deploy EchoTune AI to Vercel

## Quick Deploy (One-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dzp5103/Spotify-echo&env=MONGODB_URI,JWT_SECRET,SESSION_SECRET,REDIS_URL,SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,OPENAI_API_KEY,PERPLEXITY_API_KEY&envDescription=Environment%20variables%20for%20EchoTune%20AI&envLink=https://github.com/dzp5103/Spotify-echo/blob/main/vercel.env.txt)

## Manual Deployment

### Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables** - Configure your API keys and database connections

### Step 1: Prepare Your Repository

Ensure your repository has:
- ✅ `vercel.json` configuration
- ✅ `package.json` with build scripts
- ✅ `api/` directory for serverless functions
- ✅ `src/frontend/` for React application

### Step 2: Connect to Vercel

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the framework

2. **Configure Project**
   - Project Name: `echotune-ai` (or your preferred name)
   - Framework Preset: `Vite`
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 3: Set Environment Variables

Copy these from your `vercel.env.txt` file:

```bash
# Required
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Optional but Recommended
REDIS_URL=your_redis_connection_string
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### Step 4: Deploy

1. **First Deployment**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Wait for build completion (usually 2-5 minutes)

2. **Verify Deployment**
   - Check the deployment URL
   - Test the health endpoint: `/api/health`
   - Verify frontend loads correctly

### Step 5: Custom Domain (Optional)

1. **Add Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **SSL Certificate**
   - Vercel automatically provides SSL certificates
   - HTTPS is enabled by default

## Environment Configuration

### Production Environment Variables

Create a `.env.production.vercel` file:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
REDIS_URL=redis://username:password@host:port

# Security
JWT_SECRET=your_very_long_random_secret_key
SESSION_SECRET=your_very_long_random_session_secret

# External APIs
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Application
NODE_ENV=production
FRONTEND_URL=https://your-domain.vercel.app
```

### Vercel CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
# ... add other variables
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   vercel logs
   
   # Rebuild locally
   npm run build
   ```

2. **Environment Variables**
   ```bash
   # List current variables
   vercel env ls
   
   # Remove and re-add
   vercel env rm VARIABLE_NAME production
   vercel env add VARIABLE_NAME production
   ```

3. **API Routes Not Working**
   - Check `vercel.json` configuration
   - Verify `api/` directory structure
   - Test locally with `npm run dev`

### Performance Optimization

1. **Enable Edge Functions**
   ```json
   {
     "functions": {
       "api/**": {
         "runtime": "edge"
       }
     }
   }
   ```

2. **Optimize Bundle Size**
   - Use dynamic imports
   - Enable tree shaking
   - Compress assets

3. **Caching Strategy**
   - Implement Redis caching
   - Use Vercel's edge caching
   - Set proper cache headers

## Monitoring & Analytics

### Vercel Analytics

- **Performance Monitoring**: Built-in performance insights
- **Error Tracking**: Automatic error reporting
- **Real-time Metrics**: Live deployment statistics

### Custom Monitoring

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: 'vercel'
  });
});
```

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to Git
   - Use Vercel's encrypted environment variables
   - Rotate keys regularly

2. **API Security**
   - Implement rate limiting
   - Use CORS properly
   - Validate all inputs

3. **HTTPS Only**
   - Vercel provides automatic HTTPS
   - Redirect HTTP to HTTPS
   - Use secure cookies

## Support & Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Project Issues**: [github.com/dzp5103/Spotify-echo/issues](https://github.com/dzp5103/Spotify-echo/issues)

## Deployment Checklist

- [ ] Repository is public or Vercel has access
- [ ] `vercel.json` is properly configured
- [ ] Environment variables are set
- [ ] Build passes locally (`npm run build`)
- [ ] API routes are working
- [ ] Frontend loads correctly
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate is active
- [ ] Monitoring is set up
- [ ] Performance is optimized

---

**Ready to deploy?** Click the "Deploy with Vercel" button above for instant deployment! 🚀