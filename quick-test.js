const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing current state...');
  
  // Go to homepage
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'current-homepage.png', fullPage: true });
  console.log('Homepage screenshot saved');
  
  // Try to click profile if visible
  try {
    const profileIcon = await page.locator('a[href="/feed"]');
    if (await profileIcon.isVisible({ timeout: 5000 })) {
      await profileIcon.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'current-feed.png', fullPage: true });
      console.log('Feed page screenshot saved');
    }
  } catch (error) {
    console.log('Profile icon not found - might not be logged in');
  }
  
  console.log('Check current-homepage.png and current-feed.png');
  await browser.close();
})();