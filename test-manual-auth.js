// Test manual authentication with mock Telegram data
const fetch = require('node-fetch');

async function testAuth() {
  console.log('Testing authentication endpoint with mock data...\n');
  
  // Mock Telegram auth data
  const mockAuthData = {
    id: 123456789,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    photo_url: 'https://example.com/photo.jpg',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'mock_hash_for_development'
  };
  
  try {
    // 1. Test authentication endpoint
    console.log('1. Sending auth request to /api/auth/telegram...');
    const authResponse = await fetch('https://learn-parent-sharing-app.netlify.app/api/auth/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockAuthData),
    });
    
    const authResult = await authResponse.json();
    console.log('Auth response status:', authResponse.status);
    console.log('Auth response:', authResult);
    
    // Extract cookies from response
    const setCookieHeader = authResponse.headers.get('set-cookie');
    console.log('\n2. Set-Cookie header:', setCookieHeader);
    
    if (authResponse.ok) {
      // 2. Test auth check endpoint with cookie
      console.log('\n3. Testing /api/auth/check endpoint...');
      const checkResponse = await fetch('https://learn-parent-sharing-app.netlify.app/api/auth/check', {
        headers: {
          'Cookie': setCookieHeader || ''
        }
      });
      
      const checkResult = await checkResponse.json();
      console.log('Auth check response:', checkResult);
      
      if (checkResult.authenticated) {
        console.log('\n✅ SUCCESS: Authentication flow is working!');
        console.log('User ID:', checkResult.userId);
        console.log('Telegram ID:', checkResult.telegramId);
      } else {
        console.log('\n❌ ISSUE: Auth check failed - session not persisted');
      }
    } else {
      console.log('\n❌ ISSUE: Authentication failed');
      console.log('Error:', authResult.error);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testAuth();