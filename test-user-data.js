const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing user data on live site...');
  
  // Go to the live site
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if authenticated and get user data
  const authData = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('Auth check response:');
  console.log(JSON.stringify(authData, null, 2));
  
  if (authData.authenticated && authData.user) {
    console.log('\nUser data details:');
    console.log('- Display Name:', authData.user.displayName);
    console.log('- First Name:', authData.user.firstName);
    console.log('- Username:', authData.user.username);
    console.log('- Photo URL:', authData.user.photoUrl);
    console.log('- Has photo URL:', !!authData.user.photoUrl);
  }
  
  await browser.close();
})();