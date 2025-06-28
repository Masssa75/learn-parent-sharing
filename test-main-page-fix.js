const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  console.log('Testing main page after fix...\n');
  
  // Test the main page
  console.log('Loading https://learn-parent-sharing-app.netlify.app/ ...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(3000);
  
  const pageContent = await page.content();
  const hasError = pageContent.includes('Application error');
  console.log(`Has application error: ${hasError}`);
  
  if (!hasError) {
    // Check if page loaded correctly
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    try {
      const discoverTitle = await page.locator('h1').filter({ hasText: 'Discover' }).isVisible();
      console.log(`Discover title visible: ${discoverTitle}`);
    } catch (e) {
      console.log('Could not find Discover title');
    }
    
    try {
      const signInButton = await page.locator('text=SIGN IN').isVisible();
      console.log(`Sign in button visible: ${signInButton}`);
    } catch (e) {
      console.log('Could not find Sign in button');
    }
    
    try {
      const categories = await page.locator('button').count();
      console.log(`Total buttons on page: ${categories}`);
    } catch (e) {
      console.log('Could not count buttons');
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: 'main-page-current.png', fullPage: true });
  console.log('\nScreenshot saved as main-page-current.png');
  
  // Log console errors
  if (consoleErrors.length > 0) {
    console.log('\nConsole errors:');
    consoleErrors.forEach(err => console.log(`  - ${err}`));
  }
  
  await browser.close();
})();