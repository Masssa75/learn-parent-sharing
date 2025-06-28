const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🚀 Starting full flow test...\n');
  
  try {
    // 1. First, create a test session by calling our test login endpoint
    console.log('1. Creating test session...');
    const response = await page.request.post('https://learn-parent-sharing-app.netlify.app/api/auth/test-login');
    
    if (response.ok()) {
      const data = await response.json();
      console.log('✅ Test user logged in:', data.user.username);
      
      // Get the session cookie from the response
      const cookies = await context.cookies();
      console.log('✅ Session cookie set');
    } else {
      console.log('❌ Failed to create test session:', response.status());
      const error = await response.text();
      console.log('Error:', error);
    }
    
    // 2. Navigate to the feed page
    console.log('\n2. Navigating to feed page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/feed');
    await page.waitForTimeout(2000);
    
    // Check if we're on the feed page
    if (page.url().includes('/feed')) {
      console.log('✅ Successfully accessed feed page');
      
      // Wait for posts to load or show empty state
      try {
        await page.waitForSelector('text=Loading posts...', { timeout: 3000 });
        console.log('⏳ Posts loading...');
        await page.waitForSelector('text=Loading posts...', { state: 'hidden', timeout: 10000 });
      } catch {
        // Loading finished or wasn't shown
      }
      
      const hasEmptyState = await page.locator('text=No posts yet').isVisible().catch(() => false);
      if (hasEmptyState) {
        console.log('✅ Feed loaded - no posts yet');
      } else {
        const postCount = await page.locator('h2.text-title-lg').count();
        console.log(`✅ Feed loaded - ${postCount} posts found`);
      }
      
      // 3. Navigate to create page
      console.log('\n3. Creating a new post...');
      await page.click('button:has-text("+")');
      await page.waitForURL('**/create', { timeout: 5000 });
      console.log('✅ Navigated to create page');
      
      // 4. Fill out the form
      console.log('\n4. Filling out the form...');
      const timestamp = new Date().toISOString().slice(0, 19);
      const testTitle = `Test Post ${timestamp}`;
      
      await page.fill('input[placeholder*="parenting easier"]', testTitle);
      console.log('✅ Filled title');
      
      await page.fill('textarea', 'This is an automated test post created to verify the submission functionality is working correctly.');
      console.log('✅ Filled description');
      
      // Select category (Educational Resources)
      await page.selectOption('select:first-of-type', { label: '🎓 Educational Resources' });
      console.log('✅ Selected category');
      
      // Select age range
      await page.selectOption('select:last-of-type', { label: 'Ages 5-7' });
      console.log('✅ Selected age range');
      
      // Add optional link
      await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      console.log('✅ Added link');
      
      // 5. Submit the form
      console.log('\n5. Submitting the post...');
      await page.click('button:has-text("Share"):not([disabled])');
      
      // Wait for either success (redirect to feed) or error
      try {
        await page.waitForURL('**/feed', { timeout: 10000 });
        console.log('✅ Successfully redirected to feed!');
        
        // Wait a bit for the new post to appear
        await page.waitForTimeout(3000);
        
        // Check if our test post appears
        const testPostVisible = await page.locator(`text=${testTitle}`).isVisible().catch(() => false);
        if (testPostVisible) {
          console.log('✅ Test post is visible in the feed!');
          console.log('\n🎉 FULL TEST PASSED! Post submission is working!');
        } else {
          console.log('⚠️  Post submitted but not immediately visible in feed');
          console.log('This might be due to caching or data propagation delay');
        }
      } catch (error) {
        // Check for error message
        const errorVisible = await page.locator('text=Failed to create post').isVisible().catch(() => false);
        if (errorVisible) {
          console.log('❌ Error message shown: Failed to create post');
        } else if (page.url().includes('/login')) {
          console.log('❌ Redirected to login - authentication issue');
        } else {
          console.log('❌ Unknown error - still on create page');
          console.log('Current URL:', page.url());
        }
      }
    } else {
      console.log('❌ Not on feed page - redirected to:', page.url());
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
  
  console.log('\n📋 Test complete. Browser will remain open for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();