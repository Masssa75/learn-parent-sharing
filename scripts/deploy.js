const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function deployApp() {
  console.log('Starting deployment process...');
  
  try {
    // 1. Create GitHub repository
    console.log('\n1. Creating GitHub repository...');
    const repoName = 'learn-parent-sharing';
    
    // Check if gh CLI is available
    try {
      execSync('which gh', { stdio: 'pipe' });
      console.log('GitHub CLI found, creating repository...');
      
      try {
        execSync(`gh repo create ${repoName} --public --source=. --remote=origin --push`, {
          stdio: 'inherit'
        });
        console.log('✓ GitHub repository created and code pushed');
      } catch (error) {
        console.log('Repository might already exist, trying to add remote...');
        execSync(`git remote add origin https://github.com/$(gh api user --jq .login)/${repoName}.git`, {
          stdio: 'inherit'
        });
        execSync('git push -u origin main', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('GitHub CLI not found. Please install gh CLI or create repository manually.');
    }
    
    // 2. Deploy to Netlify
    console.log('\n2. Deploying to Netlify...');
    
    // Create netlify.toml
    const netlifyConfig = `[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_SUPABASE_URL = "${process.env.NEXT_PUBLIC_SUPABASE_URL}"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/api/*"
  to = "/api/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"`;
    
    fs.writeFileSync('netlify.toml', netlifyConfig);
    console.log('✓ Created netlify.toml');
    
    // Check if netlify CLI is available
    try {
      execSync('which netlify', { stdio: 'pipe' });
      console.log('Netlify CLI found, deploying...');
      
      // Deploy to Netlify
      execSync('netlify deploy --prod --dir=.next --site learn-parent-sharing', {
        stdio: 'inherit'
      });
      console.log('✓ Deployed to Netlify');
    } catch (error) {
      console.log('Netlify CLI not found. Please install netlify-cli or deploy manually.');
    }
    
    // 3. Execute database schema
    console.log('\n3. Setting up database...');
    // This would normally use Supabase CLI, but since we have issues, we'll note it
    console.log('Please execute the schema in supabase/schema.sql manually in Supabase dashboard');
    
    console.log('\n✅ Deployment process complete!');
    console.log('\nNext steps:');
    console.log('1. Execute database schema in Supabase dashboard');
    console.log('2. Update Telegram bot token in .env');
    console.log('3. Configure environment variables in Netlify');
    
  } catch (error) {
    console.error('Deployment error:', error.message);
  }
}

deployApp();