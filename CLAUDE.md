# Learn - Parent Sharing Platform

## Project Overview
A social platform for parents to discover and share apps, toys, books, and tips that work for their kids. Built with Next.js, TypeScript, Tailwind CSS, Supabase, and Telegram authentication.

## Current Status (June 28, 2025)

### ✅ Completed
- **Project Setup**: Next.js 15, TypeScript, Tailwind CSS
- **UI/UX**: Bold typography design system with yellow accent (#F5D547), mobile-optimized
- **Main Feed**: Homepage shows posts immediately (no landing page)
- **Database**: Supabase project created and schema deployed
- **Telegram Bot**: Configured with domain, login widget working
- **Deployment**: Live on Netlify with all environment variables
- **Design System**: Implemented bold typography design from reference HTML
  - Updated colors: Black background (#000), yellow accent (#F5D547)
  - Typography: 48px display, 36px titles, custom font sizes
  - Rounded buttons and inputs with new border radius system
  - Updated all pages with new design tokens

### 🔧 Recent Updates (This Session)
1. **Authentication Improvements**:
   - Created `/api/auth/check` endpoint that returns user data
   - Updated endpoint to fetch full user profile including photo
   - Modified homepage to display user avatar/initial in profile button
   - Added user type interface and proper state management

2. **Design System Implementation**:
   - Applied bold typography design from `bold-typography-regular-case.html`
   - Updated Tailwind config with new color scheme and typography
   - Redesigned homepage with larger, bolder typography
   - Updated create page with cleaner form layout
   - Styled login page to match new design system
   - Fixed CSS circular dependency issue

### 🐛 Known Issues
1. **Authentication Not Persisting**: The Telegram login widget works but sessions aren't persisting
   - The `/api/auth/telegram` endpoint receives auth data
   - Session cookie is set but might not be properly configured for production
   - **Next Steps**: Test actual Telegram authentication flow on live site
   - Consider implementing Supabase Auth instead of custom sessions

## Live URLs
- **Application**: https://learn-parent-sharing-app.netlify.app
- **GitHub**: https://github.com/Masssa75/learn-parent-sharing
- **Supabase Dashboard**: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Telegram Login Widget
- **Deployment**: Netlify
- **Styling**: Dark theme with green accent (#1DB954)

## Environment Variables (All configured on Netlify)
```
NEXT_PUBLIC_SUPABASE_URL=https://yvzinotrjggncbwflxok.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN=7807046295:AAGAK8EgrwpYod7R06MLq6rfigvm-6HJ3eY
TELEGRAM_BOT_USERNAME=learn_notification_bot
```

## Database Schema
Successfully deployed via Supabase CLI:
- `users` - Telegram authenticated users
- `profiles` - Extended user profiles
- `posts` - Shared discoveries
- `categories` - 6 categories seeded (Apps, Toys, Books, etc.)
- `age_ranges` - 6 age ranges seeded (0-2, 3-4, 5-7, etc.)
- `likes`, `comments`, `saved_posts` - User interactions
- `telegram_connections` - For push notifications

## Key Features Implemented
1. **Homepage Feed**: Browse without login, categories, search bar
2. **Telegram Auth**: Login widget properly configured
3. **Responsive Design**: Mobile-first, dark theme
4. **User Actions**: Like, save, comment (requires login)

## Next Steps for Session Persistence Fix

### Debug Authentication Flow
1. Check if cookie is being set with correct options:
   ```typescript
   // In /api/auth/telegram/route.ts
   response.cookies.set('session', sessionToken, {
     httpOnly: true,
     secure: true, // Must be true for production
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 7,
     path: '/' // Ensure cookie is available site-wide
   })
   ```

2. Verify cookie reading in homepage:
   ```typescript
   // In app/page.tsx
   const checkAuth = () => {
     // Debug: log all cookies
     console.log('All cookies:', document.cookie)
     const hasSession = document.cookie.includes('session=')
     setIsAuthenticated(hasSession)
   }
   ```

3. Consider using Supabase Auth instead of custom sessions:
   - Supabase has built-in session management
   - Would integrate better with RLS policies
   - More secure and easier to maintain

### Alternative: Server-Side Session Check
Instead of checking cookies client-side, use a server component or API route to verify authentication status.

## Key Files Modified This Session
1. **Design System**:
   - `/tailwind.config.js` - New color scheme and typography scales
   - `/app/globals.css` - Updated global styles (removed circular deps)
   - `/app/page.tsx` - Homepage with bold typography and user avatar
   - `/app/create/page.tsx` - Redesigned form with new inputs
   - `/app/login/page.tsx` - Updated with new design tokens

2. **Authentication**:
   - `/app/api/auth/check/route.ts` - Enhanced to return full user data
   - `/app/api/auth/telegram/route.ts` - Handles Telegram login
   - `/app/api/auth/logout/route.ts` - Logout endpoint
   - `/components/TelegramLogin.tsx` - Widget with 20px radius

## Development Commands
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Test production build
netlify deploy --prod  # Deploy to Netlify
```

## Important: Deployment Workflow
⚠️ **CRITICAL**: When making ANY changes to the codebase, you MUST follow this workflow:

1. **ALWAYS commit and push changes immediately after implementation**
2. **ALWAYS wait ~2 minutes for Netlify deployment to complete**
3. **ALWAYS test the deployed changes with Playwright browser**
4. **NEVER leave changes unpushed or untested**

Example workflow:
```bash
# After making changes
git add -A
git commit -m "Descriptive commit message"
git push origin main

# MANDATORY: Wait 2 minutes for Netlify deployment
# You can check deployment status at: https://app.netlify.com/sites/learn-parent-sharing-app/deploys

# Then test with Playwright to verify changes work in production
npx playwright test --headed
```

This is non-negotiable - every code change must be deployed and tested in production.

Example workflow:
```bash
# After making changes
git add -A
git commit -m "Descriptive commit message"
git push origin main

# Wait for Netlify deployment to complete
# Then test with Playwright
npx playwright test --headed
```

## Important Implementation Details
1. **User Avatar Display**:
   - Homepage now shows user's Telegram photo or first initial
   - Falls back to 👤 emoji if no user data
   - Hover tooltip shows full display name

2. **Design Tokens**:
   - Primary: Yellow (#F5D547)
   - Background: Pure black (#000000)
   - Text hierarchy: primary/secondary/muted
   - Border radius: button(25px), card(16px), input(12px)

3. **Typography Scale**:
   - Display: 48px (main headings)
   - Title Large: 36px (post titles)
   - Title: 24px (section headers)
   - Body: 16px (regular text)

## Autonomous Development Setup ✅

### Test User System
- **Dev Login URL**: https://learn-parent-sharing-app.netlify.app/test-auth
- **Password**: See DEV_LOGIN_PASSWORD in .env file
- **Test Users**: devtest (999999999), admintest (888888888)

### Critical Workflows
1. **Always Deploy & Test**: Make changes → Push → Wait 2min → Test on live site
2. **Check Deployment**: `node scripts/check-netlify-deploy.js`
3. **Debug Database**: `node scripts/debug-users-table.js`
4. **Apply Migrations**: `npx supabase db push`

### Common Issues & Solutions
- **RLS Blocking Access**: Apply policies via Supabase CLI
- **Column Name Mismatch**: Database uses `telegram_username`, not `username`
- **API 404**: Check deployment completed, files pushed to GitHub
- **TypeScript Errors**: Run `npx tsc --noEmit` before pushing

### Key Documentation
- See `AUTONOMOUS_WORKFLOW_GUIDE.md` for detailed patterns
- See `QUICK_START_AUTONOMOUS.md` for quick reference
- All tokens available in `.env` file

## Recent Accomplishments ✅
1. **Content Submission**: Full create/read functionality via `/api/posts`
2. **Test User System**: Secure dev login with real database users
3. **RLS Policies**: Fixed to allow anon key access to test users
4. **Deployment Monitoring**: Scripts to check and debug deployments

## Next Autonomous Tasks
1. **Test Full Flow**: Login → Create Post → Verify in Feed
2. **Add Image Upload**: Implement file storage for posts
3. **User Profiles**: Build profile pages with user's posts
4. **Search/Filter**: Add category and age range filtering
5. **Social Features**: Implement likes, saves, comments

The foundation is solid and ready for autonomous development! 🚀

## 📚 Complete Autonomous Workflow Documentation

### 🔑 Test User Login System
**This is critical for autonomous testing!**
- **URL**: https://learn-parent-sharing-app.netlify.app/test-auth
- **Password**: See `DEV_LOGIN_PASSWORD` in .env file
- **Test Users Created**:
  - `devtest` - Telegram ID: 999999999, User ID: cdad4b8b-0355-414b-90ef-9769a1045b80
  - `admintest` - Telegram ID: 888888888, User ID: de2f7130-7682-4bc0-aad1-e1b83c07cb43

### 🚀 The Golden Workflow Rule
```bash
# ALWAYS follow this pattern:
1. Make code changes
2. git add -A && git commit -m "Description" && git push origin main
3. sleep 120  # MUST wait 2 minutes for Netlify deployment
4. node test-script.js  # Test on DEPLOYED site, not local
```

### 🛠️ Essential Scripts Created This Session

#### Check Deployment Status
```bash
node scripts/check-netlify-deploy.js
# Site ID: 8d8b1724-b6a0-4b98-a84e-7a8b81baf85c
```

#### Test Dev Login
```javascript
// test-dev-login-with-password.js
const data = JSON.stringify({ password: process.env.DEV_LOGIN_PASSWORD });
// POST to https://learn-parent-sharing-app.netlify.app/api/auth/dev-login
```

#### Debug Database Issues
```bash
node scripts/debug-users-table.js  # Check what's in users table
node scripts/check-rls-policies.js  # Check if RLS is blocking
```

#### Create Test Users
```bash
node scripts/create-prod-test-users.js  # Creates test users in production DB
```

### 🗄️ Critical Database Discoveries

1. **Column Name Issue**: 
   - Database uses `telegram_username` NOT `username`
   - Always check actual schema with debug script

2. **RLS (Row Level Security) Issue**:
   - Problem: Anon key couldn't read users table
   - Solution: Applied RLS policy via Supabase CLI
   ```bash
   npx supabase link --project-ref yvzinotrjggncbwflxok
   npx supabase db push  # This fixed it!
   ```
   - Created migration: `supabase/migrations/20250628_add_users_rls_policy.sql`

3. **Environment Variables on Netlify**:
   - `ALLOW_DEV_LOGIN=true` ✅ Set
   - `DEV_LOGIN_PASSWORD` ✅ Set (see .env file)
   - Without these, dev login won't work!

### 🐛 Common Issues & Solutions

#### "API returns 404"
1. Check deployment completed: `node scripts/check-netlify-deploy.js`
2. Make sure file was pushed: `git status`
3. Wait full 2 minutes after push

#### "Cannot read from database"
1. It's almost always RLS policies
2. Test with service key vs anon key to confirm
3. Apply migration with `npx supabase db push`

#### "Test user not found"
1. User exists but RLS blocking (most common)
2. Check with: `node scripts/debug-users-table.js`
3. Apply RLS fix if needed

#### "TypeScript errors on build"
```bash
npx tsc --noEmit  # Check before pushing
# Fix pattern for catch blocks:
catch (error) {
  error instanceof Error ? error.message : 'Unknown error'
}
```

### 📝 What We Implemented This Session

1. **Content Submission System**:
   - `/api/posts` - GET (fetch posts) and POST (create posts)
   - Connected create form to API
   - Feed page fetches real posts from database

2. **Secure Test User System**:
   - Password-protected dev login endpoint
   - Real database users (not mocks)
   - RLS policies fixed to allow access

3. **Deployment Monitoring**:
   - Scripts to check Netlify deployment status
   - List all sites and get site IDs
   - Trigger manual deployments

4. **Database Debugging Tools**:
   - Check table structure
   - Test RLS policies
   - Debug user data

### 🎯 Key Success Patterns

1. **Always Test Deployed Version**
   - Local works ≠ Production works
   - Netlify has different env vars
   - RLS policies affect production

2. **Debug Systematically**
   ```bash
   # Is it deployed?
   node scripts/check-netlify-deploy.js
   
   # Is it a database issue?
   node scripts/debug-users-table.js
   
   # Is it RLS?
   node scripts/check-rls-policies.js
   ```

3. **Use Real Database Operations**
   - No mocking - test real flows
   - Service key for debugging
   - Anon key for production testing

### 🔧 Supabase CLI Commands Used
```bash
# These saved us!
npx supabase link --project-ref yvzinotrjggncbwflxok
npx supabase db push  # Applies migrations
npx supabase init  # Already done
```

### 🚨 Emergency Procedures

**If deploy fails**: Check TypeScript errors with `npx tsc --noEmit`
**If DB inaccessible**: Check RLS with both keys
**If login fails**: Verify env vars on Netlify + test users exist

### 📋 Tokens Available in .env
All automation tokens are stored in `.env`:
- GitHub token (for pushing)
- Netlify token (for deployment checks)
- Supabase keys (for database access)
- Various API keys

### 🎉 Session Accomplishments Summary
1. ✅ Implemented full content submission flow
2. ✅ Created secure test user system with password
3. ✅ Fixed RLS policies blocking database access
4. ✅ Set up comprehensive debugging scripts
5. ✅ Documented everything for autonomous work

**The app is now ready for autonomous development and testing!**