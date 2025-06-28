const { chromium } = require('playwright');

async function waitForDeployment(page, maxAttempts = 30) {
  console.log('Waiting for deployment to complete...');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await page.goto('https://learn-parent-sharing-app.netlify.app', { waitUntil: 'networkidle' });
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/auth/check');
        return res.status;
      });
      
      if (response === 200) {
        console.log('Deployment is live!');
        return true;
      }
    } catch (error) {
      // Deployment might not be ready yet
    }
    
    console.log(`Attempt ${i + 1}/${maxAttempts} - Deployment not ready yet...`);
    await page.waitForTimeout(10000); // Wait 10 seconds between attempts
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Wait for deployment
  const isDeployed = await waitForDeployment(page);
  
  if (!isDeployed) {
    console.log('Deployment timeout. Please check Netlify dashboard.');
    await browser.close();
    return;
  }
  
  console.log('\nTesting homepage profile icon...');
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Check if profile icon is visible
  const profileIcon = await page.locator('a[href="/feed"]');
  if (await profileIcon.isVisible()) {
    console.log('✓ Profile icon is visible');
    
    // Check if it has text content (the initial)
    const textContent = await profileIcon.locator('span').textContent();
    console.log(`✓ Profile icon shows: "${textContent}"`);
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'test-homepage-fixed.png' });
    console.log('✓ Homepage screenshot saved');
    
    // Click to go to feed page
    await profileIcon.click();
    await page.waitForLoadState('networkidle');
    
    console.log('\nTesting feed page design...');
    
    // Check if we're on feed page
    const url = page.url();
    if (url.includes('/feed')) {
      console.log('✓ Successfully navigated to feed page');
      
      // Check for yellow design elements
      const yellowButton = await page.locator('.bg-brand-yellow').first();
      if (await yellowButton.isVisible()) {
        console.log('✓ Yellow design elements are present');
      }
      
      // Check profile icon on feed page
      const feedProfileIcon = await page.locator('button.bg-brand-yellow').first();
      const feedInitial = await feedProfileIcon.locator('span').textContent();
      console.log(`✓ Feed page profile icon shows: "${feedInitial}"`);
      
      // Take screenshot of feed page
      await page.screenshot({ path: 'test-feed-fixed.png' });
      console.log('✓ Feed page screenshot saved');
      
      // Test sign out menu
      await feedProfileIcon.click();
      await page.waitForTimeout(500);
      
      const signOutButton = await page.locator('text=Sign Out');
      if (await signOutButton.isVisible()) {
        console.log('✓ Sign out menu is working');
      }
    }
  } else {
    console.log('✗ Profile icon not visible - user might not be logged in');
  }
  
  console.log('\nTests completed. Check screenshots for visual confirmation.');
  await browser.close();
})();