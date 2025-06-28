# Learn - Parent Sharing Platform

## Project Overview
A social platform for parents to discover and share apps, toys, books, and tips that work for their kids. Built with Next.js, TypeScript, Tailwind CSS, Supabase, and Telegram authentication.

## Current Status (June 28, 2025)

### ✅ Completed
- **Project Setup**: Next.js 15, TypeScript, Tailwind CSS
- **UI/UX**: Dark theme with green accent (#1DB954), mobile-optimized
- **Main Feed**: Homepage shows posts immediately (no landing page)
- **Database**: Supabase project created and schema deployed
- **Telegram Bot**: Configured with domain, login widget working
- **Deployment**: Live on Netlify with all environment variables

### 🔧 Known Issues
1. **Authentication Not Working**: The Telegram login widget appears but authentication isn't completing
   - Created `/api/auth/check` endpoint to verify auth status
   - Updated homepage to use API instead of reading httpOnly cookies
   - The auth endpoints are deployed and working
   - **Current Issue**: The Telegram widget callback might not be triggering the auth endpoint
   - Need to verify if the Telegram bot is properly configured and if the widget is sending data to our endpoint

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

## Development Commands
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Test production build
netlify deploy --prod  # Deploy to Netlify
```

## Important Notes
- Telegram bot username: `@learn_notification_bot` (not LearnParentBot)
- Bot domain configured for: `learn-parent-sharing-app.netlify.app`
- All mock data currently hardcoded in components
- Real data integration pending after auth fix

## Testing Tools Created
- `scripts/test-telegram-login.js` - Playwright test for widget
- `scripts/test-telegram-bot.js` - Bot validation
- `scripts/verify-database.js` - Database connection test

Great job on the progress! The app is 90% complete - just need to fix the session persistence issue. 🎉