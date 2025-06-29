# Admin Setup Guide

## Setting Up Your First Admin User

### Step 1: Apply the Database Migration

The admin system migration needs to be applied to your Supabase database. You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new)
2. Copy the contents of `app/supabase/migrations/20250629000000_add_admin_system.sql`
3. Paste it in the SQL editor and click "Run"

#### Option B: Using the Migration Script
```bash
cd app
npm run apply-migration
```

### Step 2: Log in to the Platform

1. Visit your deployed site
2. Click "Login with Telegram" and authenticate with your Telegram account

### Step 3: Find Your Telegram ID

After logging in, run this command to find your Telegram ID:

```bash
cd app
npm run find-telegram-id "your_name_or_username"
```

Example:
```bash
npm run find-telegram-id marcschwyn
```

This will show you your Telegram ID and other account details.

### Step 4: Make Yourself an Admin

Once you have your Telegram ID, run:

```bash
npm run setup-admin YOUR_TELEGRAM_ID
```

Example:
```bash
npm run setup-admin 123456789
```

### Step 5: Access the Admin Dashboard

Visit `/admin` on your site to access the admin dashboard where you can:
- View all users
- Make other users admins
- Remove admin privileges

## Admin Features

- **Admin Dashboard**: `/admin` - Manage users and admin privileges
- **API Endpoints**: 
  - `GET /api/admin/users` - List all users (admin only)
  - `POST /api/admin/users` - Update admin status (admin only)
- **User Object**: Auth responses now include `isAdmin` field

## Security

- Admin status is stored in the database with proper RLS policies
- Only admins can view and modify admin status
- Admin actions are tracked in the `admin_users` table