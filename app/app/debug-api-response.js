const fetch = require('node-fetch');

async function debugAPI() {
  try {
    // 1. First login
    console.log('1. Logging in...');
    const loginRes = await fetch('https://learn-parent-sharing-app.netlify.app/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        password: 'test-learn-2025',
        telegramId: 999999999 // devtest
      })
    });
    
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('Login response:', loginRes.status);
    console.log('Cookie:', setCookie?.substring(0, 50) + '...');
    
    // 2. Check auth with the session cookie
    console.log('\n2. Checking auth...');
    const authRes = await fetch('https://learn-parent-sharing-app.netlify.app/api/auth/check-with-points', {
      headers: {
        'Cookie': setCookie || ''
      }
    });
    
    const authData = await authRes.json();
    console.log('Auth response:', JSON.stringify(authData, null, 2));
    
    // 3. Fetch posts
    console.log('\n3. Fetching posts...');
    const postsRes = await fetch('https://learn-parent-sharing-app.netlify.app/api/posts', {
      headers: {
        'Cookie': setCookie || ''
      }
    });
    
    const postsData = await postsRes.json();
    console.log('Posts response structure:', Object.keys(postsData));
    
    if (postsData.posts && Array.isArray(postsData.posts)) {
      console.log(`\nFound ${postsData.posts.length} posts`);
      
      // Show first 3 posts
      postsData.posts.slice(0, 3).forEach((post, i) => {
        console.log(`\nPost ${i + 1}:`);
        console.log(`  Title: ${post.title}`);
        console.log(`  Liked: ${post.liked}`);
        console.log(`  Likes count: ${post.likes}`);
        console.log(`  User ID: ${post.userId}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugAPI();