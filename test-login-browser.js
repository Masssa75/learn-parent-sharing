const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Testing dev login on deployed site...\n');
  
  try {
    // 1. Navigate to test auth page
    console.log('1. Navigating to test auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-auth-deployed.png' });
    console.log('✓ Screenshot saved as test-auth-deployed.png');
    
    // 2. Click the dev login button
    console.log('\n2. Clicking "Login as Dev Test User" button...');
    await page.click('button:has-text("Login as Dev Test User")');
    
    // 3. Wait for response
    console.log('3. Waiting for response...');
    await page.waitForTimeout(5000);
    
    // Check current URL and status
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);
    
    // Look for status messages
    const statusText = await page.locator('pre').textContent().catch(() => null);
    if (statusText) {
      console.log('\nStatus message:');
      console.log(statusText);
    }
    
    // Check for error instructions
    const hasInstructions = await page.locator('text=Setup Instructions').isVisible().catch(() => false);
    if (hasInstructions) {
      console.log('\n⚠️  Test user needs to be created in Supabase');
      const instructions = await page.locator('ol li').allTextContents();
      console.log('\nInstructions:');
      instructions.forEach(inst => console.log(`- ${inst}`));
    }
    
    // Check if we're on feed page (successful login)
    if (currentUrl.includes('/feed')) {
      console.log('\n✅ Successfully logged in and redirected to feed!');
      
      // Try to create a post
      console.log('\n4. Testing post creation...');
      await page.click('button:has-text("+")');
      await page.waitForTimeout(2000);
      
      if (page.url().includes('/create')) {
        console.log('✅ On create page');
        await page.screenshot({ path: 'create-page-deployed.png' });
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-result-deployed.png', fullPage: true });
    console.log('\n✓ Final screenshot saved as test-result-deployed.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  console.log('\nTest complete. Browser will remain open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();