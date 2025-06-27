const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('/api/auth/telegram')) {
      console.log('Auth API Response:', response.status(), response.url());
      response.text().then(text => console.log('Response body:', text)).catch(() => {});
    }
  });
  
  console.log('1. Opening live login page...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/login');
  
  console.log('2. Waiting for Telegram widget to load...');
  await page.waitForTimeout(3000);
  
  // Check if widget loaded
  const widgetFrames = await page.$$('iframe[src*="telegram.org"]');
  console.log('3. Telegram widget iframe found:', widgetFrames.length > 0);
  
  // Take screenshot
  await page.screenshot({ path: 'live-login-page.png', fullPage: true });
  console.log('4. Screenshot saved as live-login-page.png');
  
  // Check cookies before login
  const cookiesBefore = await context.cookies();
  console.log('5. Cookies before login:', cookiesBefore.map(c => c.name));
  
  console.log('\n6. Testing authentication flow...');
  console.log('   Please complete the following steps:');
  console.log('   1. Click the Telegram login button in the browser');
  console.log('   2. Complete the authentication in Telegram');
  console.log('   3. Watch the console for API responses and cookie updates');
  
  // Monitor for navigation
  page.on('framenavigated', frame => {
    console.log('Frame navigated:', frame.url());
  });
  
  // Wait for potential redirect after login
  try {
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 120000 });
    console.log('\n7. Successfully redirected to homepage!');
  } catch (e) {
    console.log('\n7. No redirect detected within 2 minutes');
  }
  
  // Check current URL
  console.log('8. Current URL:', page.url());
  
  // Check cookies after login attempt
  const cookiesAfter = await context.cookies();
  console.log('\n9. Cookies after login attempt:');
  cookiesAfter.forEach(cookie => {
    console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
    if (cookie.name === 'session') {
      console.log(`     httpOnly: ${cookie.httpOnly}, secure: ${cookie.secure}, sameSite: ${cookie.sameSite}`);
    }
  });
  
  // Check if session cookie exists
  const sessionCookie = cookiesAfter.find(c => c.name === 'session');
  console.log('\n10. Session cookie found:', !!sessionCookie);
  
  // Navigate to homepage if not already there
  if (!page.url().includes('learn-parent-sharing-app.netlify.app/') || page.url().includes('/login')) {
    console.log('\n11. Navigating to homepage to check auth state...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForTimeout(2000);
  }
  
  // Check authentication status on homepage
  const authCheck = await page.evaluate(() => {
    return {
      hasCookie: document.cookie.includes('session='),
      cookies: document.cookie
    };
  });
  console.log('\n12. Client-side auth check:');
  console.log('    - Has session cookie:', authCheck.hasCookie);
  console.log('    - All cookies:', authCheck.cookies || 'No cookies');
  
  // Check for auth UI elements
  const signInButton = await page.$('a[href="/login"]');
  const profileButton = await page.$('a[href="/feed"]');
  const floatingButton = await page.$('button.fixed.bottom-4.right-4');
  
  console.log('\n13. UI state:');
  console.log('    - Sign In button visible:', !!signInButton);
  console.log('    - Profile button visible:', !!profileButton);
  console.log('    - Floating create button visible:', !!floatingButton);
  
  // Take final screenshot
  await page.screenshot({ path: 'live-homepage-after-auth.png', fullPage: true });
  console.log('\n14. Final screenshot saved as live-homepage-after-auth.png');
  
  console.log('\nTest complete. Press Ctrl+C to close the browser...');
  
  // Keep browser open
  await new Promise(() => {});
})();