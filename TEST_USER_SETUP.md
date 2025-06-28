# Test User Setup Guide

## Overview
To enable automated testing with real database interactions, you need to create test users in your Supabase database.

## Required Test Users

### 1. Regular Test User
- **telegram_id**: `999999999`
- **username**: `devtest`
- **first_name**: `Dev`
- **last_name**: `Test`
- **photo_url**: `null` (optional)

### 2. Admin Test User (optional)
- **telegram_id**: `888888888`
- **username**: `admintest`
- **first_name**: `Admin`
- **last_name**: `Test`
- **photo_url**: `null` (optional)

## Setup Instructions

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok
   - Sign in with your credentials

2. **Navigate to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Select the `users` table

3. **Create Test User(s)**
   - Click "Insert" button
   - Fill in the fields:
     - `telegram_id`: 999999999
     - `username`: devtest
     - `first_name`: Dev
     - `last_name`: Test
     - Leave other fields as default
   - Click "Save"

4. **Enable Dev Login on Netlify**
   - Go to: https://app.netlify.com/sites/learn-parent-sharing-app/settings/env
   - Add environment variables:
     - Key: `ALLOW_DEV_LOGIN`
     - Value: `true`
     - Key: `DEV_LOGIN_PASSWORD`
     - Value: `your-secure-password` (or use default: test-learn-2025)
   - Deploy the changes

## Testing the Setup

1. Navigate to: https://learn-parent-sharing-app.netlify.app/test-auth
2. Click "Login as Dev Test User"
3. You should be redirected to the feed page
4. Create a test post to verify everything works

## API Endpoints

- **Dev Login**: POST `/api/auth/dev-login`
  - No body required
  - Returns session cookie for test user
  - Only works when ALLOW_DEV_LOGIN=true

## Security Notes

- The dev login endpoint only works when `ALLOW_DEV_LOGIN=true`
- Test users can only be accessed via the dev login endpoint
- In production, remove the ALLOW_DEV_LOGIN variable
- Test users cannot login via Telegram widget

## Troubleshooting

If login fails:
1. Check if test user exists in database
2. Verify ALLOW_DEV_LOGIN is set to "true" (string)
3. Check Netlify deployment completed
4. Ensure telegram_id matches exactly (999999999)