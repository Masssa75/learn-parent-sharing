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
  
  console.log('Testing correct URL structure...\n');
  
  // Test root URL
  console.log('1. Testing root URL (/)...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(3000);
  
  const rootContent = await page.content();
  const hasRootError = rootContent.includes('Application error');
  console.log(`   - Has error: ${hasRootError}`);
  console.log(`   - Title: ${await page.title()}`);
  
  // Take screenshot
  await page.screenshot({ path: 'root-page.png' });
  
  // Log console errors
  const errors = consoleMessages.filter(msg => msg.type === 'error');
  if (errors.length > 0) {
    console.log('   - Console errors:');
    errors.forEach(err => console.log(`     ${err.text}`));
  }
  
  await browser.close();
})();