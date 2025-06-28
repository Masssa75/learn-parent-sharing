const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Opening test auth page...\n');
  
  // Navigate to test auth page
  await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
  console.log('✓ Page loaded');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-auth-page.png', fullPage: true });
  console.log('✓ Screenshot saved as test-auth-page.png');
  
  console.log('\nPage should be open in the browser.');
  console.log('You can manually click "Login as Dev Test User" to test.');
  console.log('\nIf you see a 404, the deployment might not be complete yet.');
  
  // Keep browser open
  await page.waitForTimeout(60000);
  
  await browser.close();
})();