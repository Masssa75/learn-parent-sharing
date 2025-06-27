const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployToNetlify() {
  console.log('🚀 Deploying Learn app to Netlify...\n');
  
  try {
    // 1. Check if we have a build
    if (!fs.existsSync('.next')) {
      console.log('No build found. Building the app...');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // 2. Create a deployment package
    console.log('\n📦 Creating deployment package...');
    
    // Create _redirects file for Next.js
    const redirects = `/*    /index.html   200`;
    fs.writeFileSync('public/_redirects', redirects);
    
    // 3. Deploy using Netlify CLI if available
    try {
      execSync('which netlify', { stdio: 'pipe' });
      console.log('\nNetlify CLI found. Deploying...');
      
      execSync('netlify deploy --prod --dir=.next --site learn-parent-sharing', {
        stdio: 'inherit'
      });
      
      console.log('\n✅ Deployed successfully!');
    } catch (error) {
      console.log('\nNetlify CLI not found.');
      console.log('\nTo deploy manually:');
      console.log('1. Go to https://app.netlify.com');
      console.log('2. Drag and drop the .next folder');
      console.log('3. Or connect to GitHub repository');
    }
    
    // 4. Create drop-in deployment folder
    console.log('\nCreating deployment folder for manual deployment...');
    if (!fs.existsSync('netlify-deploy')) {
      fs.mkdirSync('netlify-deploy');
    }
    
    // Copy necessary files
    execSync('cp -r .next/* netlify-deploy/', { stdio: 'pipe' });
    execSync('cp netlify.toml netlify-deploy/', { stdio: 'pipe' });
    
    console.log('\n📁 Deployment folder created: netlify-deploy/');
    console.log('You can drag this folder to Netlify Drop');
    
  } catch (error) {
    console.error('Deployment error:', error.message);
  }
}

// Also output deployment instructions
console.log(`
=== MANUAL DEPLOYMENT INSTRUCTIONS ===

1. GitHub Repository:
   - Go to: https://github.com/new
   - Name: learn-parent-sharing
   - Make it public
   - Don't initialize with README
   
   Then run:
   git remote add origin https://github.com/YOUR_USERNAME/learn-parent-sharing.git
   git push -u origin main

2. Netlify Deployment:
   Option A: Drag & Drop
   - Go to: https://app.netlify.com/drop
   - Drag the 'netlify-deploy' folder
   
   Option B: Connect to GitHub
   - Go to: https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Connect GitHub and select your repo
   
3. Environment Variables (add in Netlify):
   NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
   NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
   TELEGRAM_BOT_TOKEN=${process.env.TELEGRAM_BOT_TOKEN}

=====================================
`);

// Load env vars
require('dotenv').config();

// Run deployment
deployToNetlify();