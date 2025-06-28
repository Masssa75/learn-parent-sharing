const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Testing full login flow with password...\n');
  
  try {
    // 1. Navigate to test auth page
    console.log('1. Going to test auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForTimeout(2000);
    
    // 2. Enter password
    console.log('2. Entering password...');
    await page.fill('input[type="password"]', 'test-learn-2025');
    
    // 3. Click login button
    console.log('3. Clicking login button...');
    await page.click('button:has-text("Login as Dev Test User")');
    
    // 4. Wait for response
    console.log('4. Waiting for response...');
    await page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);
    
    if (currentUrl.includes('/feed')) {
      console.log('✅ Successfully logged in! Now on feed page');
      
      // Take screenshot of feed
      await page.screenshot({ path: 'feed-logged-in.png' });
      console.log('✓ Feed screenshot saved');
      
      // Try to create a post
      console.log('\n5. Testing post creation...');
      await page.click('button:has-text("+")');
      await page.waitForTimeout(2000);
      
      if (page.url().includes('/create')) {
        console.log('✅ On create page');
        
        // Fill out the form
        console.log('6. Filling out post form...');
        await page.fill('input[placeholder*="parenting easier"]', 'Test Post from Automated Test');
        await page.fill('textarea', 'This post was created by the automated test to verify the submission flow works correctly.');
        
        // Select category (first option)
        await page.selectOption('select:first-of-type', { index: 1 });
        console.log('✓ Selected category');
        
        // Select age range (first option)
        await page.selectOption('select:last-of-type', { index: 1 });
        console.log('✓ Selected age range');
        
        // Add link
        await page.fill('input[type="url"]', 'https://example.com/test');
        console.log('✓ Added link');
        
        // Submit
        console.log('\n7. Submitting post...');
        await page.click('button:has-text("Share"):not([disabled])');
        
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/feed')) {
          console.log('✅ Post submitted! Redirected back to feed');
          console.log('\n🎉 FULL TEST PASSED! Everything works!');
        } else if (page.url().includes('/login')) {
          console.log('❌ Redirected to login - auth issue');
        } else {
          console.log('⚠️  Still on create page - check for errors');
        }
      }
    } else {
      // Check for error messages
      const statusText = await page.locator('pre').textContent().catch(() => null);
      if (statusText) {
        console.log('\n❌ Error:', statusText);
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-test-state.png', fullPage: true });
    console.log('\n✓ Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\nTest complete. Browser will remain open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();