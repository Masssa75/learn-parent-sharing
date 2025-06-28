const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing unified feed...');
  
  // Go to main app page
  await page.goto('https://learn-parent-sharing-app.netlify.app/app');
  console.log('✓ Navigated to /app');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'unified-feed-current-state.png', fullPage: true });
  console.log('✓ Screenshot saved as unified-feed-current-state.png');
  
  // Check page title
  const title = await page.title();
  console.log(`✓ Page title: ${title}`);
  
  // Log any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Test login flow
  console.log('\nTesting authenticated flow...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
  await page.waitForTimeout(2000);
  
  // Login with test user
  const passwordInput = await page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(process.env.DEV_LOGIN_PASSWORD || 'test-password');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
    console.log('✓ Logged in with test user');
    
    // Now go back to app page
    await page.goto('https://learn-parent-sharing-app.netlify.app/app');
    await page.waitForTimeout(3000);
    
    // Take authenticated screenshot
    await page.screenshot({ path: 'unified-feed-authenticated.png', fullPage: true });
    console.log('✓ Authenticated screenshot saved');
  }
  
  await browser.close();
  console.log('\n✅ Test completed!');
})();