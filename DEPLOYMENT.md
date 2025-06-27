# Deployment Instructions for Learn Parent Sharing Platform

## Current Status
✅ Application built successfully
✅ All code committed to git
✅ Netlify configuration ready

## Manual Deployment Steps

### 1. GitHub Repository
Create a new repository on GitHub:
```bash
# If you have GitHub CLI installed:
gh repo create learn-parent-sharing --public --source=. --remote=origin --push

# Or manually:
# 1. Go to https://github.com/new
# 2. Name: learn-parent-sharing
# 3. Make it public
# 4. Don't initialize with README
# 5. Run:
git remote add origin https://github.com/YOUR_USERNAME/learn-parent-sharing.git
git push -u origin main
```

### 2. Supabase Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL

### 3. Netlify Deployment
1. Go to https://app.netlify.com
2. Click "Add new site" > "Import an existing project"
3. Connect to GitHub and select the repository
4. Build settings should auto-detect:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `TELEGRAM_BOT_TOKEN` (when you have it)
6. Deploy!

### 4. Update Telegram Bot
1. Create a new bot via @BotFather on Telegram
2. Get the bot token
3. Update `.env` and Netlify environment variables
4. Update `TELEGRAM_BOT_USERNAME` in the code

## Quick Deploy Commands
```bash
# Build locally
npm run build

# Test production build
npm start

# Deploy to Netlify (if CLI installed)
netlify deploy --prod
```

## Repository Structure
- `/app` - Next.js app routes
- `/components` - React components
- `/lib` - Utilities and Supabase client
- `/supabase` - Database schema
- `/public` - Static assets

## Live URLs
- GitHub: https://github.com/[YOUR_USERNAME]/learn-parent-sharing
- Netlify: https://learn-parent-sharing.netlify.app (after deployment)