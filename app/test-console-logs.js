const { chromium } = require('playwright');

async function testWithLogs() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Fetching posts') || text.includes('Received') || text.includes('Auth') || text.includes('DEBUG')) {
      console.log('Console:', text);
    }
  });

  try {
    console.log('1. Navigating to test-auth...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("Login as devtest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/');
    
    console.log('\n2. Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    console.log('\n3. All relevant console logs:');
    logs.forEach(log => {
      if (log.includes('Fetching') || log.includes('Auth') || log.includes('Received') || log.includes('DEBUG')) {
        console.log('  -', log);
      }
    });
    
    console.log('\n4. Refreshing page...');
    logs.length = 0; // Clear logs
    await page.reload();
    await page.waitForTimeout(5000);
    
    console.log('\n5. Console logs after refresh:');
    logs.forEach(log => {
      if (log.includes('Fetching') || log.includes('Auth') || log.includes('Received') || log.includes('DEBUG')) {
        console.log('  -', log);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testWithLogs();