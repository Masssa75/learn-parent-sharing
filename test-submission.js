const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing post submission functionality...');
  
  // Go to the deployed site
  await page.goto('https://learn-parent-sharing-app.netlify.app');
  console.log('✓ Navigated to homepage');
  
  // Wait a moment to see the page
  await page.waitForTimeout(2000);
  
  // Check if we're authenticated (should redirect to feed if logged in)
  const url = page.url();
  console.log('Current URL:', url);
  
  if (url.includes('/feed')) {
    console.log('✓ Already authenticated, on feed page');
    
    // Check if posts are loading
    try {
      await page.waitForSelector('text=Loading posts...', { timeout: 3000 });
      console.log('✓ Posts are loading...');
    } catch {
      // Check if posts loaded or empty state
      const hasEmptyState = await page.locator('text=No posts yet').isVisible().catch(() => false);
      const hasPosts = await page.locator('[class*="Post Header"]').first().isVisible().catch(() => false);
      
      if (hasEmptyState) {
        console.log('✓ No posts yet - empty state displayed');
      } else if (hasPosts) {
        console.log('✓ Posts loaded successfully');
      }
    }
    
    // Click the create button
    await page.click('button:has-text("+")');
    console.log('✓ Clicked create button');
    
    // Wait for create page
    await page.waitForURL('**/create');
    console.log('✓ Navigated to create page');
    
    // Fill out the form
    await page.fill('input[placeholder*="parenting easier"]', 'Test Post from Playwright');
    await page.fill('textarea', 'This is a test post created by our automated test to verify the submission functionality works correctly.');
    
    // Select category
    await page.selectOption('select:first-of-type', { index: 1 }); // Select first category
    console.log('✓ Selected category');
    
    // Select age range
    await page.selectOption('select:last-of-type', { index: 1 }); // Select first age range
    console.log('✓ Selected age range');
    
    // Add optional link
    await page.fill('input[type="url"]', 'https://example.com');
    console.log('✓ Added link');
    
    // Submit the form
    await page.click('button:has-text("Share"):not([disabled])');
    console.log('✓ Submitted form');
    
    // Wait for navigation back to feed
    try {
      await page.waitForURL('**/feed', { timeout: 10000 });
      console.log('✓ Successfully redirected to feed after submission');
      
      // Wait a moment for the new post to appear
      await page.waitForTimeout(3000);
      
      // Check if our test post appears
      const testPostVisible = await page.locator('text=Test Post from Playwright').isVisible().catch(() => false);
      if (testPostVisible) {
        console.log('✅ Test post successfully created and visible in feed!');
      } else {
        console.log('⚠️  Post created but not immediately visible in feed');
      }
    } catch (error) {
      console.log('❌ Error after submission:', error.message);
      
      // Check if we got redirected to login (not authenticated)
      if (page.url().includes('/login')) {
        console.log('⚠️  Redirected to login - user not authenticated');
      }
    }
  } else {
    console.log('⚠️  Not authenticated - on homepage');
    console.log('Please log in first to test post submission');
  }
  
  // Keep browser open for manual inspection
  console.log('\nTest complete. Browser will remain open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();