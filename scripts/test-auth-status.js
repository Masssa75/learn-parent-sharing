const { chromium } = require('playwright');

async function testAuthStatus() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  try {
    console.log('1. Going to test auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of test auth page
    await page.screenshot({ path: 'test-auth-page.png' });
    
    console.log('2. Checking page content...');
    const content = await page.content();
    console.log('Page title:', await page.title());
    
    // Check if buttons exist
    const devtestBtn = await page.$('button:has-text("Login as devtest")');
    const admintestBtn = await page.$('button:has-text("Login as admintest")');
    console.log('devtest button exists:', !!devtestBtn);
    console.log('admintest button exists:', !!admintestBtn);
    
    console.log('\n3. Attempting to login as admintest...');
    await page.click('button:has-text("Login as admintest")');
    
    // Wait for any response
    await page.waitForTimeout(3000);
    
    // Check for any error messages
    const errorMsg = await page.$('text=Error');
    if (errorMsg) {
      const errorText = await errorMsg.textContent();
      console.log('❌ Error found:', errorText);
    }
    
    // Check for success message
    const successMsg = await page.$('text=Success');
    if (successMsg) {
      const successText = await successMsg.textContent();
      console.log('✅ Success found:', successText);
    }
    
    // Check current URL
    console.log('\n4. Current URL:', page.url());
    
    // Take final screenshot
    await page.screenshot({ path: 'test-auth-result.png' });
    
    // If we're on the home page, check for delete buttons
    if (!page.url().includes('test-auth')) {
      console.log('\n5. Navigated away from test-auth, checking for admin features...');
      const deleteButtons = await page.$$('button:has-text("DELETE")');
      console.log('Delete buttons found:', deleteButtons.length);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-auth-error.png' });
  } finally {
    await browser.close();
  }
}

testAuthStatus();