const { chromium } = require('playwright');

(async () => {
  console.log('Testing authentication after fixes...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Auth') || msg.text().includes('auth')) {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth/')) {
      console.log(`API Response [${response.url()}]:`, response.status());
      response.text().then(text => console.log('Response body:', text)).catch(() => {});
    }
  });
  
  console.log('1. Checking if deployment is complete...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/api/auth/check');
  const checkResponse = await page.textContent('body');
  console.log('Auth check endpoint response:', checkResponse);
  
  console.log('\n2. Opening login page...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/login');
  await page.waitForTimeout(3000);
  
  // Check if widget loaded
  const widgetFrames = await page.$$('iframe[src*="telegram.org"]');
  console.log('3. Telegram widget loaded:', widgetFrames.length > 0);
  
  // Take screenshot
  await page.screenshot({ path: 'auth-test-login.png', fullPage: true });
  
  console.log('\n4. Please complete Telegram authentication in the browser...');
  console.log('   Watching for auth responses and redirects...\n');
  
  // Wait for redirect or timeout
  try {
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 120000 });
    console.log('5. Successfully redirected to homepage!');
  } catch (e) {
    console.log('5. No redirect detected - checking current state...');
  }
  
  // Check auth status via API
  console.log('\n6. Checking authentication status via API...');
  const authCheckResponse = await page.evaluate(async () => {
    const response = await fetch('/api/auth/check');
    return await response.json();
  });
  console.log('Auth check result:', authCheckResponse);
  
  // Navigate to homepage if needed
  if (!page.url().includes('learn-parent-sharing-app.netlify.app/') || page.url().includes('/login')) {
    await page.goto('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForTimeout(2000);
  }
  
  // Check UI state
  const signInButton = await page.$('a[href="/login"]');
  const profileButton = await page.$('a[href="/feed"]');
  const createButton = await page.$('button.fixed.bottom-4.right-4');
  const ctaBox = await page.$('div.fixed.bottom-4.left-4.right-4');
  
  console.log('\n7. UI State:');
  console.log('   - Sign In button visible:', !!signInButton);
  console.log('   - Profile button visible:', !!profileButton);
  console.log('   - Create button visible:', !!createButton);
  console.log('   - CTA box visible:', !!ctaBox);
  
  // Take final screenshot
  await page.screenshot({ path: 'auth-test-homepage.png', fullPage: true });
  console.log('\n8. Screenshots saved: auth-test-login.png and auth-test-homepage.png');
  
  if (authCheckResponse.authenticated) {
    console.log('\n✅ SUCCESS: Authentication is working! User is logged in.');
    console.log('   User ID:', authCheckResponse.userId);
    console.log('   Telegram ID:', authCheckResponse.telegramId);
  } else {
    console.log('\n❌ ISSUE: User is not authenticated after login attempt.');
  }
  
  console.log('\nTest complete. Press Ctrl+C to close the browser...');
  await new Promise(() => {});
})();