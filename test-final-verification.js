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
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  console.log('Final verification test...\n');
  
  // Test the main page
  console.log('1. Loading https://learn-parent-sharing-app.netlify.app/ ...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(5000);
  
  // Check for application error
  const pageContent = await page.content();
  const hasApplicationError = pageContent.includes('Application error');
  console.log(`   ✓ Application error present: ${hasApplicationError}`);
  
  if (!hasApplicationError) {
    // Check page loaded correctly
    const title = await page.title();
    console.log(`   ✓ Page title: ${title}`);
    
    // Check for key elements
    const discoverTitle = await page.locator('h1:has-text("Discover")').count();
    console.log(`   ✓ Discover title found: ${discoverTitle > 0}`);
    
    const categoryButtons = await page.locator('button').filter({ hasText: /^(ALL|APPS|TOYS|TIPS)$/ }).count();
    console.log(`   ✓ Category buttons: ${categoryButtons}`);
    
    const posts = await page.locator('[class*="mb-8"]').count();
    console.log(`   ✓ Posts displayed: ${posts}`);
    
    // Check loading state
    const loadingSpinner = await page.locator('.animate-spin').count();
    console.log(`   ✓ Loading spinner: ${loadingSpinner > 0 ? 'visible' : 'hidden'}`);
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'final-working-state.png', fullPage: true });
  console.log('\n2. Screenshot saved as final-working-state.png');
  
  // Report errors
  console.log('\n3. Error Summary:');
  console.log(`   - Page errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    pageErrors.forEach(err => console.log(`     ${err}`));
  }
  
  console.log(`   - Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => console.log(`     ${err}`));
  }
  
  // Overall status
  const isWorking = !hasApplicationError && pageErrors.length === 0;
  console.log(`\n${isWorking ? '✅' : '❌'} App is ${isWorking ? 'working properly' : 'still having issues'}!`);
  
  await browser.close();
})();