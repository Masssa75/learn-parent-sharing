const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Testing Dev Login Flow...\n');
  
  // 1. Navigate to test auth page
  console.log('1. Navigating to test auth page...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
  await page.waitForTimeout(2000);
  
  // 2. Click the dev login button
  console.log('2. Clicking Dev Login button...');
  await page.click('button:has-text("Login as Dev Test User")');
  
  // 3. Wait for response
  await page.waitForTimeout(3000);
  
  // Check if we see error or success
  const errorVisible = await page.locator('text=Error:').isVisible().catch(() => false);
  const instructionsVisible = await page.locator('text=Setup Instructions:').isVisible().catch(() => false);
  const successVisible = await page.locator('text=Success!').isVisible().catch(() => false);
  
  if (errorVisible && instructionsVisible) {
    console.log('\n❌ Test user not found in database');
    console.log('📋 Instructions displayed for creating test user');
    
    // Get the instructions
    const instructions = await page.locator('ol li').allTextContents();
    console.log('\nPlease follow these steps:');
    instructions.forEach((instruction, i) => {
      console.log(`${i + 1}. ${instruction}`);
    });
    
    console.log('\n⚠️  IMPORTANT: You need to create the test user first!');
    console.log('Go to your Supabase dashboard and create a user with telegram_id: 999999999');
  } else if (successVisible) {
    console.log('✅ Login successful! Redirecting to feed...');
    
    // Wait for redirect
    await page.waitForURL('**/feed', { timeout: 10000 }).catch(() => {});
    
    if (page.url().includes('/feed')) {
      console.log('✅ Successfully on feed page');
      
      // Test creating a post
      console.log('\n3. Testing post creation...');
      await page.click('button:has-text("+")');
      await page.waitForURL('**/create', { timeout: 5000 });
      
      console.log('✅ On create page');
      
      // Fill form
      await page.fill('input[placeholder*="parenting easier"]', 'Test Post from Dev User');
      await page.fill('textarea', 'This is a real test post created by the dev test user.');
      await page.selectOption('select:first-of-type', { index: 1 });
      await page.selectOption('select:last-of-type', { index: 1 });
      
      console.log('✅ Form filled, submitting...');
      await page.click('button:has-text("Share"):not([disabled])');
      
      // Wait for result
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/feed')) {
        console.log('✅ Post created successfully! Redirected to feed');
        console.log('\n🎉 FULL TEST PASSED!');
      } else {
        console.log('❌ Post creation may have failed');
      }
    }
  } else {
    console.log('❌ Unexpected state - check if ALLOW_DEV_LOGIN is set on Netlify');
    
    // Try to get any error message
    const statusText = await page.locator('pre').textContent().catch(() => '');
    if (statusText) {
      console.log('Status:', statusText);
    }
  }
  
  console.log('\nTest complete. Browser will remain open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();