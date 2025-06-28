const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing authentication data on live site...');
  
  // Go to the live site
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check the auth endpoint response
  const authData = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('Full auth response:', JSON.stringify(authData, null, 2));
  
  // Check localStorage for any auth data
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });
  
  console.log('LocalStorage:', localStorage);
  
  // Check cookies
  const cookies = await page.context().cookies();
  console.log('Cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })));
  
  // Try to inspect the profile icon element
  const profileIcon = await page.locator('a[href="/feed"]');
  if (await profileIcon.isVisible()) {
    const innerHTML = await profileIcon.innerHTML();
    console.log('Profile icon HTML:', innerHTML);
  }
  
  await browser.close();
})();