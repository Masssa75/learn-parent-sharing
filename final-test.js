const { chromium } = require('playwright');

async function waitForDeployment(page) {
  console.log('Waiting for deployment to complete...');
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto('https://learn-parent-sharing-app.netlify.app', { waitUntil: 'domcontentloaded', timeout: 10000 });
      const response = await page.evaluate(() => {
        return fetch('/api/auth/check').then(r => r.status).catch(() => 0);
      });
      if (response === 200) {
        console.log('✓ Deployment is live!');
        return true;
      }
    } catch (e) {
      // Still deploying
    }
    console.log(`Waiting... (${i+1}/20)`);
    await page.waitForTimeout(10000);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Wait for deployment
  const deployed = await waitForDeployment(page);
  if (!deployed) {
    console.log('Deployment timeout');
    await browser.close();
    return;
  }
  
  // Test the site
  console.log('\nOpening Learn app...');
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  await page.waitForLoadState('networkidle');
  
  console.log('\nThe browser is now open. Please:');
  console.log('1. Click "SIGN IN"');
  console.log('2. Log in with Telegram');
  console.log('3. Check if your profile image shows up');
  console.log('4. Click the profile icon to go to feed page');
  console.log('5. Verify the feed page has yellow design');
  console.log('\nI will take screenshots after you log in...');
  
  // Wait for login
  let loggedIn = false;
  for (let i = 0; i < 60; i++) {
    const auth = await page.evaluate(async () => {
      const res = await fetch('/api/auth/check');
      return res.json();
    });
    
    if (auth.authenticated) {
      console.log('\n✓ Login detected!');
      console.log('User:', auth.user?.displayName);
      console.log('Photo URL:', auth.user?.photoUrl);
      loggedIn = true;
      break;
    }
    await page.waitForTimeout(2000);
  }
  
  if (loggedIn) {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'final-homepage-logged-in.png', fullPage: true });
    console.log('✓ Homepage screenshot saved');
    
    // Try to navigate to feed
    const profileIcon = await page.locator('a[href="/feed"]');
    if (await profileIcon.isVisible()) {
      await profileIcon.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'final-feed-page.png', fullPage: true });
      console.log('✓ Feed page screenshot saved');
    }
  }
  
  console.log('\nTest complete. Check the screenshots!');
  console.log('Browser will stay open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();