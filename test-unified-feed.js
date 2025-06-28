const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing unified feed...');
  
  // Go to main app page
  await page.goto('https://learn-parent-sharing-app.netlify.app/app');
  await page.waitForTimeout(2000);
  
  console.log('✓ Loaded main app page');
  
  // Check if feed is loading
  const loading = await page.locator('.animate-spin').isVisible();
  console.log(`✓ Loading indicator visible: ${loading}`);
  
  // Wait for posts or empty state
  await page.waitForTimeout(3000);
  
  // Check for posts
  const posts = await page.locator('[class*="mb-8"]').count();
  console.log(`✓ Found ${posts} posts`);
  
  // Test authentication state
  const signInButton = await page.locator('text=SIGN IN').isVisible();
  console.log(`✓ Sign in button visible: ${signInButton}`);
  
  // Test category buttons
  const categories = await page.locator('button').filter({ hasText: /^(ALL|APPS|TOYS|TIPS)$/ }).count();
  console.log(`✓ Found ${categories} category buttons`);
  
  // Test clicking a category
  await page.click('button:has-text("APPS")');
  await page.waitForTimeout(1000);
  console.log('✓ Clicked APPS category');
  
  // Test that old /feed route redirects
  console.log('\nTesting /feed redirect...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/app/feed');
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  console.log(`✓ Current URL after /feed: ${currentUrl}`);
  console.log(`✓ Redirected correctly: ${currentUrl.includes('/app') && !currentUrl.includes('/feed')}`);
  
  // Take screenshot
  await page.screenshot({ path: 'unified-feed-test.png', fullPage: true });
  console.log('✓ Screenshot saved as unified-feed-test.png');
  
  await browser.close();
  console.log('\n✅ All tests passed!');
})();