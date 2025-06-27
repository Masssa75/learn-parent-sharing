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
    }
  });
  
  console.log('1. Opening login page...');
  await page.goto('http://localhost:3000/login');
  
  console.log('2. Waiting for Telegram widget to load...');
  await page.waitForTimeout(3000);
  
  // Check if widget loaded
  const widgetFrame = await page.frameLocator('iframe[src*="telegram.org"]').first();
  console.log('3. Telegram widget iframe found:', !!widgetFrame);
  
  // Take screenshot
  await page.screenshot({ path: 'login-page.png', fullPage: true });
  console.log('4. Screenshot saved as login-page.png');
  
  // Check cookies before login
  const cookiesBefore = await context.cookies();
  console.log('5. Cookies before login:', cookiesBefore.map(c => c.name));
  
  console.log('\n6. Manual action required:');
  console.log('   - Click the Telegram login button in the browser');
  console.log('   - Complete the authentication in Telegram');
  console.log('   - Watch the console for cookie updates');
  
  // Wait for navigation after login
  await page.waitForNavigation({ 
    url: 'http://localhost:3000/',
    timeout: 60000 
  }).catch(() => console.log('Navigation timeout - checking cookies anyway'));
  
  // Check cookies after potential login
  const cookiesAfter = await context.cookies();
  console.log('\n7. Cookies after login attempt:', cookiesAfter.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
  
  // Check if session cookie exists
  const sessionCookie = cookiesAfter.find(c => c.name === 'session');
  if (sessionCookie) {
    console.log('\n8. Session cookie found!');
    console.log('   - HttpOnly:', sessionCookie.httpOnly);
    console.log('   - Secure:', sessionCookie.secure);
    console.log('   - SameSite:', sessionCookie.sameSite);
    console.log('   - Path:', sessionCookie.path);
  } else {
    console.log('\n8. No session cookie found!');
  }
  
  // Check authentication status on homepage
  const isAuthenticated = await page.evaluate(() => {
    return document.cookie.includes('session=');
  });
  console.log('\n9. Client-side auth check:', isAuthenticated);
  
  // Check for auth UI elements
  const signInButton = await page.$('a[href="/login"]');
  const profileButton = await page.$('a[href="/feed"]');
  console.log('10. UI state:');
  console.log('    - Sign In button visible:', !!signInButton);
  console.log('    - Profile button visible:', !!profileButton);
  
  console.log('\nPress Ctrl+C to close the browser when done testing...');
  
  // Keep browser open
  await new Promise(() => {});
})();