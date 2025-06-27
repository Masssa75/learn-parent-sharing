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

## Next Steps
- [ ] Connect frontend to Supabase for real data
- [ ] Implement actual Telegram bot for notifications
- [ ] Add image upload functionality
- [ ] Create user profile page
- [ ] Add search functionality
- [ ] Deploy to production

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