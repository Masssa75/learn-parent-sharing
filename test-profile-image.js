const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing profile image feature on live site...');
  
  // Go to the live site
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if the auth check endpoint exists and returns user data
  const authResponse = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/check');
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('Auth check response:', authResponse);
  
  // Take a screenshot
  await page.screenshot({ path: 'live-site-profile-check.png' });
  
  // Check if sign in button or profile icon is visible
  const signInButton = await page.locator('a.bg-brand-yellow:has-text("SIGN IN")').first().isVisible();
  const profileIcon = await page.locator('a[href="/feed"]').isVisible();
  
  console.log('Sign in button visible:', signInButton);
  console.log('Profile icon visible:', profileIcon);
  
  if (profileIcon) {
    // Check if the profile icon has an image
    const hasImage = await page.locator('a[href="/feed"] img').count() > 0;
    console.log('Profile has image element:', hasImage);
  }
  
  console.log('\nDeployment appears to be live. Check live-site-profile-check.png for visual confirmation.');
  
  await browser.close();
})();