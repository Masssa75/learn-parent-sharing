const { chromium } = require('playwright');

async function waitForNewDeployment(page) {
  console.log('Waiting for new deployment...');
  const startTime = Date.now();
  
  for (let i = 0; i < 25; i++) {
    try {
      await page.goto('https://learn-parent-sharing-app.netlify.app', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Check if the new code with console.log is deployed
      const hasNewCode = await page.evaluate(() => {
        // Try to trigger the auth check by reloading
        return new Promise((resolve) => {
          const originalLog = console.log;
          let foundLog = false;
          
          console.log = function(...args) {
            originalLog.apply(console, args);
            if (args[0] && args[0].includes('Auth check response:')) {
              foundLog = true;
            }
          };
          
          // Wait a bit to see if we get the log
          setTimeout(() => {
            console.log = originalLog;
            resolve(foundLog);
          }, 2000);
        });
      });
      
      if (hasNewCode) {
        console.log('✓ New deployment detected!');
        return true;
      }
    } catch (e) {
      // Still deploying
    }
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`Waiting... ${elapsed}s elapsed`);
    await page.waitForTimeout(10000);
  }
  
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Auth check') || msg.text().includes('User data')) {
      console.log('PAGE LOG:', msg.text());
    }
  });
  
  // Wait for deployment
  const deployed = await waitForNewDeployment(page);
  
  if (!deployed) {
    console.log('New deployment not detected yet. Testing current version...');
  }
  
  // Go to the page
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Wait for console logs
  await page.waitForTimeout(3000);
  
  // Check current auth state
  const authData = await page.evaluate(async () => {
    const response = await fetch('/api/auth/check');
    return response.json();
  });
  
  console.log('\nDirect auth check:', JSON.stringify(authData, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
  console.log('Screenshot saved as debug-homepage.png');
  
  console.log('\nOpen the browser console to see the debug logs.');
  console.log('The browser will stay open for 1 minute...');
  
  await page.waitForTimeout(60000);
  await browser.close();
})();