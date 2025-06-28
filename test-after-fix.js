const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  console.log('Testing after fix...\n');
  
  // Test the test page first
  console.log('1. Testing /test page...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/test', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(2000);
  
  const testContent = await page.content();
  const hasTestError = testContent.includes('Application error');
  console.log(`   - Has error: ${hasTestError}`);
  
  if (!hasTestError) {
    const testElements = await page.locator('div:has-text("Test Page")').isVisible();
    console.log(`   - Test page loaded: ${testElements}`);
  }
  
  // Now test the main page
  console.log('\n2. Testing main page (/)...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(3000);
  
  const mainContent = await page.content();
  const hasMainError = mainContent.includes('Application error');
  console.log(`   - Has error: ${hasMainError}`);
  
  if (!hasMainError) {
    const discoverTitle = await page.locator('h1:has-text("Discover")').isVisible();
    console.log(`   - Discover title visible: ${discoverTitle}`);
    
    const categories = await page.locator('button').filter({ hasText: /^(ALL|APPS|TOYS|TIPS)$/ }).count();
    console.log(`   - Category buttons: ${categories}`);
  }
  
  // Take screenshots
  await page.screenshot({ path: 'after-fix-screenshot.png', fullPage: true });
  console.log('\n✅ Screenshot saved as after-fix-screenshot.png');
  
  // Log any console errors
  const errors = consoleMessages.filter(msg => msg.type === 'error');
  if (errors.length > 0) {
    console.log('\nConsole errors:');
    errors.forEach(err => console.log(`  - ${err.text}`));
  }
  
  await browser.close();
})();