# EchoTune AI - Deployment Validation Checklist

- [ ] docker build --target runtime succeeds (Dockerfile multi-stage)
- [ ] docker compose up shows app and redis healthy
- [ ] GET /health returns { status: "healthy" }
- [ ] Spotify OAuth succeeds locally (http://localhost:3000/auth/callback)
- [ ] DigitalOcean App Platform deploys and app is accessible
- [ ] Vercel deployment accessible (if using frontend-only with API proxy)
- [ ] OAuth redirect works in production (DO and/or Vercel domain)
- [ ] No secrets committed (.env and secrets absent from repo)
- [ ] Image size acceptable (< 400MB recommended)
- [ ] Bundle size acceptable (Vite build outputs optimized)
- [ ] README Deployment section updated
- [ ] Redis configured (REDIS_URL) or using local redis service
- [ ] MongoDB configured (MONGODB_URI) or disabled fallback ok

## Notes
- Spotify Redirect URIs must exactly match:
  - Dev: http://localhost:3000/auth/callback
  - DO:  https://YOUR_DO_DOMAIN/auth/callback
  - Vercel: https://YOUR_VERCEL_DOMAIN/auth/callback (if API served via Vercel)
- For Vercel + separate backend, set vercel.json rewrites to your backend domain.