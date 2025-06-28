const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing login and profile display...');
  
  // Enable request/response logging
  page.on('response', response => {
    if (response.url().includes('/api/auth')) {
      console.log(`API Response - ${response.url()}: ${response.status()}`);
    }
  });
  
  // Go to login page
  await page.goto('https://learn-parent-sharing-app.netlify.app/login');
  await page.waitForLoadState('networkidle');
  
  console.log('On login page. Please complete the Telegram login manually.');
  console.log('Waiting for redirect to homepage...');
  
  // Wait for navigation after login (with longer timeout)
  try {
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 120000 });
    console.log('Redirected to homepage!');
    
    // Wait a bit for auth to settle
    await page.waitForTimeout(2000);
    
    // Now check the auth status
    const authData = await page.evaluate(async () => {
      const response = await fetch('/api/auth/check');
      return await response.json();
    });
    
    console.log('Auth data after login:', JSON.stringify(authData, null, 2));
    
    // Check if profile icon shows image
    const profileIcon = await page.locator('a[href="/feed"]');
    if (await profileIcon.isVisible()) {
      const hasImage = await page.locator('a[href="/feed"] img').count() > 0;
      const hasInitial = await page.locator('a[href="/feed"] span').textContent();
      
      console.log('Profile icon visible: true');
      console.log('Has image element:', hasImage);
      console.log('Text content:', hasInitial);
      
      // Take screenshot
      await page.screenshot({ path: 'after-login-profile.png' });
      console.log('Screenshot saved as after-login-profile.png');
    }
    
  } catch (error) {
    console.log('Timeout or error:', error.message);
  }
  
  console.log('\nPress Ctrl+C to close the browser when done.');
  
  // Keep browser open
  await page.waitForTimeout(300000);
})();