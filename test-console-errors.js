const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  console.log('Navigating to app page...');
  
  try {
    await page.goto('https://learn-parent-sharing-app.netlify.app/app', {
      waitUntil: 'networkidle'
    });
  } catch (error) {
    console.log('Navigation error:', error.message);
  }
  
  await page.waitForTimeout(5000);
  
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => {
    if (msg.type === 'error') {
      console.log(`ERROR: ${msg.text}`);
      if (msg.location.url) {
        console.log(`  at ${msg.location.url}:${msg.location.lineNumber}`);
      }
    }
  });
  
  console.log('\n=== Page Errors ===');
  pageErrors.forEach(error => {
    console.log(`ERROR: ${error.message}`);
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
  });
  
  // Try to get more details from the page
  const pageContent = await page.content();
  const hasErrorMessage = pageContent.includes('Application error');
  console.log(`\nError message visible: ${hasErrorMessage}`);
  
  // Check if any JavaScript files failed to load
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  await page.screenshot({ path: 'error-state.png' });
  console.log('\nScreenshot saved as error-state.png');
  
  await browser.close();
})();