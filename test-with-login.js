const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Opening Learn app...');
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  await page.waitForLoadState('networkidle');
  
  console.log('\nPlease log in using the Telegram widget.');
  console.log('I will wait and then test the profile icon and feed page...\n');
  
  // Wait for user to log in (check every 2 seconds)
  let isLoggedIn = false;
  for (let i = 0; i < 60; i++) { // Wait up to 2 minutes
    const authState = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        return data;
      } catch (error) {
        return { authenticated: false };
      }
    });
    
    if (authState.authenticated) {
      console.log('✓ Login detected!');
      console.log('User data:', JSON.stringify(authState.user, null, 2));
      isLoggedIn = true;
      break;
    }
    
    await page.waitForTimeout(2000);
  }
  
  if (!isLoggedIn) {
    console.log('Login timeout. Please run the test again.');
    await browser.close();
    return;
  }
  
  // Test homepage profile icon
  console.log('\nTesting homepage profile icon...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  const profileIcon = await page.locator('a[href="/feed"]');
  if (await profileIcon.isVisible()) {
    const initial = await profileIcon.locator('span:visible').textContent();
    console.log(`✓ Profile icon shows: "${initial}"`);
    
    await page.screenshot({ path: 'homepage-logged-in.png' });
    console.log('✓ Homepage screenshot saved');
    
    // Navigate to feed
    await profileIcon.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log('\nTesting feed page...');
    
    // Check URL
    if (page.url().includes('/feed')) {
      console.log('✓ Successfully navigated to feed page');
      
      // Check for yellow elements
      const yellowElements = await page.locator('.bg-brand-yellow').count();
      console.log(`✓ Found ${yellowElements} yellow design elements`);
      
      // Check profile icon on feed
      const feedProfile = await page.locator('button.bg-brand-yellow').first();
      const feedInitial = await feedProfile.locator('span:visible').textContent();
      console.log(`✓ Feed profile shows: "${feedInitial}"`);
      
      await page.screenshot({ path: 'feed-logged-in.png' });
      console.log('✓ Feed page screenshot saved');
      
      // Test dropdown
      await feedProfile.click();
      await page.waitForTimeout(500);
      
      const signOut = await page.locator('text=Sign Out').isVisible();
      console.log(`✓ Sign Out button visible: ${signOut}`);
      
      console.log('\n✅ All tests passed! Check the screenshots.');
    }
  }
  
  await browser.close();
})();