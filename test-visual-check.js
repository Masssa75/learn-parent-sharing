const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Opening live site...');
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'homepage-current-state.png', fullPage: true });
  console.log('Homepage screenshot saved as homepage-current-state.png');
  
  // Check authentication state
  const authState = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('\nAuthentication state:', JSON.stringify(authState, null, 2));
  
  // If logged in, try to navigate to feed
  if (authState.authenticated) {
    const profileIcon = await page.locator('a[href="/feed"]');
    if (await profileIcon.isVisible()) {
      await profileIcon.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'feed-current-state.png', fullPage: true });
      console.log('Feed page screenshot saved as feed-current-state.png');
    }
  } else {
    console.log('\nNot logged in. Click "SIGN IN" to test the full flow.');
  }
  
  console.log('\nKeeping browser open for 2 minutes. You can interact with the site.');
  console.log('Press Ctrl+C to close when done.');
  
  await page.waitForTimeout(120000);
  await browser.close();
})();