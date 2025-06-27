# Telegram Bot Setup Guide

## Current Issue
The Telegram login widget shows "Bot domain invalid" because the bot needs to be configured to allow your domain.

## How to Fix

### 1. Open Telegram and find @BotFather
- Open your Telegram app
- Search for `@BotFather` (official bot with blue checkmark)

### 2. Configure your bot domain
Send these commands to @BotFather:

```
/mybots
```

Then select: `@learn_notification_bot`

Choose: `Bot Settings`

Choose: `Domain`

Send your domain:
```
learn-parent-sharing-app.netlify.app
```

### 3. Verify the setup
After setting the domain, the login widget should show a proper "Log in with Telegram" button instead of "Bot domain invalid".

## Alternative: Create a New Bot

If you can't access the existing bot, create a new one:

1. Send `/newbot` to @BotFather
2. Give it a name: `Learn Parent Sharing`
3. Give it a username: `learn_parent_sharing_bot` (must end with 'bot')
4. Save the token you receive
5. Set the domain as described above
6. Update the bot token and username in your `.env` file

## Testing
Once configured, the login page should show a blue "Log in with Telegram" button that users can click to authenticate.

## Important Notes
- The domain must match exactly (no http:// or trailing slash)
- Changes may take a few minutes to propagate
- The bot token in your app must match the bot you're configuring