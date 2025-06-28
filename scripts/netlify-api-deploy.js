const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Netlify API endpoint
const NETLIFY_API = 'api.netlify.com';

// Function to make HTTPS requests
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function createSite() {
  console.log('Creating Netlify site...');
  
  const siteData = {
    name: `learn-parent-sharing-${Math.random().toString(36).substring(7)}`,
    custom_domain: null,
    force_ssl: true
  };

  try {
    const response = await httpsRequest({
      hostname: NETLIFY_API,
      path: '/api/v1/sites',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Learn-App'
      }
    }, siteData);
    
    console.log('Site created:', response.url);
    return response;
  } catch (error) {
    console.log('Could not create site via API (authentication required)');
    return null;
  }
}

async function deployToNetlify() {
  console.log('🚀 Attempting Netlify deployment...\n');
  
  // Check if we have Netlify CLI and are authenticated
  try {
    execSync('netlify status', { stdio: 'pipe' });
    console.log('Netlify CLI is authenticated. Deploying...');
    
    // Initialize new site
    try {
      execSync('netlify init --manual', {
        input: '\nlearn-parent-sharing\n\n',
        stdio: 'pipe'
      });
    } catch (e) {
      // Site might already exist
    }
    
    // Deploy the build
    const output = execSync('netlify deploy --prod --dir=netlify-deploy', {
      encoding: 'utf8'
    });
    
    console.log(output);
    
    // Extract URL from output
    const urlMatch = output.match(/Website URL:\s*(https:\/\/[^\s]+)/);
    if (urlMatch) {
      console.log('\n✅ Deployment successful!');
      console.log(`🌐 Site URL: ${urlMatch[1]}`);
      
      // Save deployment info
      const deploymentInfo = {
        url: urlMatch[1],
        timestamp: new Date().toISOString(),
        status: 'deployed'
      };
      
      fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    }
    
    return true;
  } catch (error) {
    console.log('Netlify CLI not authenticated.');
    return false;
  }
}

async function main() {
  // First, check if build exists
  if (!fs.existsSync('netlify-deploy')) {
    console.error('Build directory not found. Run npm run build first.');
    process.exit(1);
  }
  
  // Try to deploy
  const deployed = await deployToNetlify();
  
  if (!deployed) {
    console.log('\n=== MANUAL DEPLOYMENT REQUIRED ===\n');
    console.log('Since we cannot authenticate with Netlify automatically, please deploy manually:');
    console.log('\nOption 1: Drag & Drop');
    console.log('1. Go to: https://app.netlify.com/drop');
    console.log('2. Drag the "netlify-deploy" folder to the browser');
    console.log('3. Wait for deployment to complete');
    console.log('\nOption 2: GitHub Integration');
    console.log('1. First push code to GitHub');
    console.log('2. Go to: https://app.netlify.com');
    console.log('3. Click "Add new site" > "Import an existing project"');
    console.log('4. Connect GitHub and select your repository');
    console.log('\nEnvironment Variables to add in Netlify:');
    console.log(`NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
    console.log(`TELEGRAM_BOT_TOKEN=${process.env.TELEGRAM_BOT_TOKEN}`);
    console.log('\n=====================================');
    
    // Create a deployment instructions file
    const instructions = `
# Netlify Deployment Instructions

## Quick Deploy (Drag & Drop)
1. Go to: https://app.netlify.com/drop
2. Drag the "netlify-deploy" folder from this project
3. Wait for deployment

## Environment Variables
Add these in Netlify dashboard after deployment:

NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
TELEGRAM_BOT_TOKEN=${process.env.TELEGRAM_BOT_TOKEN}

## Build Settings (if using GitHub)
- Build command: npm run build
- Publish directory: .next
`;
    
    fs.writeFileSync('NETLIFY_DEPLOY_INSTRUCTIONS.md', instructions);
    console.log('\nInstructions saved to: NETLIFY_DEPLOY_INSTRUCTIONS.md');
  }
}

// Load environment variables
require('dotenv').config();

// Run deployment
main().catch(console.error);