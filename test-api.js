const https = require('https');

// Test GET /api/posts endpoint
console.log('Testing API endpoints...\n');

const testGetPosts = () => {
  return new Promise((resolve) => {
    console.log('1. Testing GET /api/posts...');
    
    https.get('https://learn-parent-sharing-app.netlify.app/api/posts', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(json, null, 2).substring(0, 200)}...`);
          
          if (res.statusCode === 200 && json.posts) {
            console.log(`   ✓ Successfully fetched ${json.posts.length} posts\n`);
          } else {
            console.log('   ⚠️  Unexpected response\n');
          }
        } catch (e) {
          console.log(`   ❌ Error parsing response: ${e.message}\n`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`   ❌ Request failed: ${err.message}\n`);
      resolve();
    });
  });
};

const testPostEndpoint = () => {
  return new Promise((resolve) => {
    console.log('2. Testing POST /api/posts (without auth)...');
    
    const postData = JSON.stringify({
      title: 'Test Post',
      description: 'Test description',
      category: 'Apps & Software',
      ageRanges: ['3-5'],
      linkUrl: 'https://example.com'
    });
    
    const options = {
      hostname: 'learn-parent-sharing-app.netlify.app',
      path: '/api/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode === 401) {
          console.log('   ✓ Correctly returns 401 Unauthorized (authentication required)\n');
        } else {
          console.log(`   Response: ${data}\n`);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Request failed: ${err.message}\n`);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
};

// Run tests
(async () => {
  await testGetPosts();
  await testPostEndpoint();
  console.log('API tests complete!');
})();