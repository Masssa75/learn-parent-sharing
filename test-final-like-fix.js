const { chromium } = require('playwright');

async function testFinalLikeFix() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true  // Open dev tools to see network requests
  });
  const page = await browser.newPage();
  
  // Monitor console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Session') || text.includes('User') || text.includes('Fetching') || 
        text.includes('liked') || text.includes('First post')) {
      console.log('Console:', text);
    }
  });
  
  // Monitor network requests to see cookies
  page.on('request', request => {
    if (request.url().includes('/api/posts')) {
      console.log('\nAPI Request to /api/posts:');
      console.log('  Headers:', request.headers());
    }
  });

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    // 2. Wait for posts
    console.log('\n2. Waiting for posts to load...');
    await page.waitForTimeout(6000);
    
    // 3. Check network tab to see if session cookie was sent
    console.log('\n3. Checking cookies...');
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    if (sessionCookie) {
      console.log('✓ Session cookie exists:', sessionCookie.value.substring(0, 50) + '...');
    } else {
      console.log('❌ No session cookie found!');
    }
    
    // 4. Check localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('\n4. LocalStorage:', Object.keys(localStorage));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nKeeping browser open to inspect network tab...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testFinalLikeFix();