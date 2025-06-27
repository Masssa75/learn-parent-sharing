# Learn - Parent Sharing Platform

## Project Overview
A social platform for parents to discover and share apps, toys, books, and tips that work for their kids. Built with Next.js, TypeScript, Tailwind CSS, Supabase, and Telegram authentication.

## Current Status
- ✅ Project initialized with Next.js 15 and TypeScript
- ✅ Dark theme UI implemented based on selected design
- ✅ Supabase database schema created
- ✅ Telegram authentication system set up (Bot Token: 7807046295:AAGAK8EgrwpYod7R06MLq6rfigvm-6HJ3eY)
- ✅ Core pages created: Login, Feed, Create Post
- ✅ Mobile-optimized responsive design
- ✅ Production build successful
- ✅ Ready for deployment (netlify.toml configured)
- ⚠️ Using shared Supabase instance with monitoor project

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Telegram Login Widget
- **Styling**: Dark theme with green accent (#1DB954)

## Key Features Implemented
1. **Telegram Authentication**
   - One-click login with Telegram
   - No passwords needed
   - Profile data auto-populated from Telegram

2. **Feed Page**
   - Category filtering (All, Apps, Toys, Books, Activities, Tips)
   - Post cards with likes, comments, and save functionality
   - Age range badges
   - Mobile-optimized layout

3. **Create Post**
   - Title and description fields
   - Category selection with emojis
   - Multiple age range selection
   - Optional link and photo upload

## Database Schema
- `users` - Telegram authenticated users
- `profiles` - Extended user profiles with kids ages
- `posts` - Shared discoveries
- `categories` - Post categories
- `age_ranges` - Predefined age ranges
- `likes`, `comments`, `saved_posts` - User interactions
- `telegram_connections` - For push notifications

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME
```

## Deployment Status & Next Steps

### Ready for Deployment:
- ✅ Production build successful
- ✅ Telegram bot token configured: 7807046295:AAGAK8EgrwpYod7R06MLq6rfigvm-6HJ3eY
- ✅ Bot username: LearnParentBot
- ✅ netlify-deploy folder created for drag-and-drop deployment
- ✅ All deployment scripts created

### Immediate Next Steps:
1. **Create New Supabase Project**:
   ```bash
   node scripts/create-supabase-project.js
   ```

2. **Execute Database Schema**:
   - After Supabase project is created, run schema from `supabase/schema.sql`
   - Use Supabase dashboard SQL editor or CLI

3. **Create GitHub Repository**:
   ```bash
   # The script is ready at:
   node scripts/create-github-repo.js
   # Or manually create and push
   ```

4. **Deploy to Netlify**:
   - Drag `netlify-deploy` folder to https://app.netlify.com/drop
   - Or connect GitHub repo after creation

### Important Files:
- `supabase/schema.sql` - Complete database schema
- `scripts/create-supabase-project.js` - Creates new Supabase project
- `scripts/create-github-repo.js` - GitHub repo creation
- `scripts/netlify-deploy.js` - Netlify deployment helper
- `netlify-deploy/` - Ready-to-deploy build folder

### Environment Variables for Production:
- Will be auto-updated after Supabase project creation
- Telegram bot already configured
- Remember to add to Netlify after deployment

## Development
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
```

## Known Issues
- Telegram login widget requires actual bot username
- Need to implement proper JWT sessions
- Image upload not yet connected to storage