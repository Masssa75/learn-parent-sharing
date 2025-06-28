const https = require('https');
require('dotenv').config();

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

if (!NETLIFY_AUTH_TOKEN) {
  console.error('❌ NETLIFY_AUTH_TOKEN not found');
  process.exit(1);
}

console.log('🔍 Listing all Netlify sites...\n');

const options = {
  hostname: 'api.netlify.com',
  path: '/api/v1/sites',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const sites = JSON.parse(data);
      
      console.log(`Found ${sites.length} sites:\n`);
      
      sites.forEach((site, index) => {
        console.log(`${index + 1}. ${site.name}`);
        console.log(`   ID: ${site.id}`);
        console.log(`   URL: ${site.url}`);
        console.log(`   Custom Domain: ${site.custom_domain || 'None'}`);
        console.log(`   Repository: ${site.build_settings?.repo || 'None'}`);
        console.log(`   Last published: ${site.published_deploy?.published_at || 'Never'}`);
        console.log('');
      });
      
      // Look for Learn project
      const learnSite = sites.find(site => 
        site.name.includes('learn') || 
        site.url.includes('learn') ||
        (site.build_settings?.repo && site.build_settings.repo.includes('learn'))
      );
      
      if (learnSite) {
        console.log('✅ Found Learn project!');
        console.log(`   Name: ${learnSite.name}`);
        console.log(`   ID: ${learnSite.id}`);
        console.log(`   Use this ID in the deployment check script`);
      }
    } else {
      console.error(`❌ API Error: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();