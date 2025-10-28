# Railway Deployment Guide

## Prerequisites
1. [Railway account](https://railway.app)
2. Git repository with your code

## Step-by-Step Deployment

### 1. Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### 2. Add PostgreSQL Database
1. In Railway dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`

### 3. Set Environment Variables
In Railway dashboard, go to Variables and add:

**Required Variables:**
```
DATABASE_URL=<automatically provided by Railway>
NEXTAUTH_URL=https://your-app-name.railway.app
NEXTAUTH_SECRET=<generate a secure random string>
NODE_ENV=production
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=<your-secure-password>
ADMIN_NAME=Super Admin
```

### 4. Deploy Application
```bash
# Connect to Railway project
railway link

# Deploy
railway up
```

### 5. Run Database Migration
```bash
# After first deployment, run migrations
railway run npm run db:deploy

# Seed admin user
railway run npm run seed-admin
```

## Important Notes

### Security
- Change `ADMIN_PASSWORD` from default
- Use strong `NEXTAUTH_SECRET` (32+ characters)
- Never commit `.env.local` to git

### Database Migration
- Railway will run `postinstall` hook automatically
- For schema changes, run `railway run npm run db:deploy`
- Always backup before major changes

### Monitoring
- Health check endpoint: `/api/health`
- Railway provides logs and metrics
- Set up error monitoring (Sentry, etc.)

## Local Development vs Production

### Local (SQLite)
```bash
npm run dev
```

### Production (PostgreSQL on Railway)
- Automatic builds on git push
- Database migrations run automatically
- Environment variables from Railway dashboard

## Common Issues

1. **Migration Failures**: Ensure DATABASE_URL is correct
2. **Build Failures**: Check dependencies in package.json
3. **Runtime Errors**: Check Railway logs for details

## Support
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway