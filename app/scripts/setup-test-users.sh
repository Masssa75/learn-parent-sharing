#!/bin/bash

echo "🚀 Setting up test users for Learn Parent Sharing Platform"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in project root. Please run from the app directory."
    exit 1
fi

echo "📋 Running seed file to create test users..."
echo ""

# Run the seed file against the remote database
# Note: This requires SUPABASE_DB_URL to be set in environment
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ SUPABASE_DB_URL environment variable not set."
    echo ""
    echo "Please set it using:"
    echo "export SUPABASE_DB_URL='postgresql://postgres:[YOUR-PASSWORD]@db.yvzinotrjggncbwflxok.supabase.co:5432/postgres'"
    echo ""
    echo "You can find your database password in:"
    echo "1. Supabase Dashboard > Settings > Database"
    echo "2. Or in your .env file (SUPABASE_SERVICE_ROLE_KEY)"
    exit 1
fi

# Run the seed file
supabase db push --db-url "$SUPABASE_DB_URL" --include-seed

echo ""
echo "✅ Test users should now be created!"
echo ""
echo "Test users created:"
echo "- Regular: telegram_id=999999999, username=devtest"
echo "- Admin: telegram_id=888888888, username=admintest"
echo ""
echo "You can now use the dev login at:"
echo "https://learn-parent-sharing-app.netlify.app/test-auth"